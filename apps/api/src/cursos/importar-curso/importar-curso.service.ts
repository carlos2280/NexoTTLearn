import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common"
import type {
  BloqueImportado,
  ImportarCursoBody,
  ImportarCursoInput,
  ImportarCursoResponse,
  ModuloImportado,
  SeccionImportada,
} from "@nexott-learn/shared-types"
import { Prisma, TipoBloque } from "@prisma/client"

import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  etiquetasEvaluablesDeSeccion,
  etiquetasSkillDeSeccion,
  representanteDeModulo,
} from "./importar-curso.helpers"
import { ParserCursoMdError, parsearCursoMd } from "./parser-md"

// Cursos completos pueden tener docenas de módulos × secciones × bloques.
// El default de 5s no alcanza; subimos a 30s con margen de espera amplio.
const TX_TIMEOUT_MS = 30_000
const TX_MAX_WAIT_MS = 10_000

// Peso de la única área exigida del curso importado (la suma de pesos de áreas
// debe ser 100 para que el curso sea publicable, ver cursos.helpers.ts).
const AREA_PESO = 100
// Puntaje objetivo del área y nota mínima de cada skill exigida (umbral 60 =
// "apto" del curso). Alineado con los defaults de publicación.
const PUNTAJE_OBJETIVO = 60
const NOTA_MINIMA_SKILL = 60

/**
 * Persiste un curso completo (curso + módulos + secciones + bloques +
 * habilitaciones + skills/área/exigidas) desde un `.md` enviado por el admin.
 * El flujo es:
 *
 *  1. Parsear el MD a `ImportarCursoInput` (parser + Zod final).
 *  2. Resolver el cliente por nombre (`cliente: "NTT Data Iberia"` ↦ id).
 *  3. Abrir transacción Prisma y crear:
 *      - Una Área (nombre = título del curso) que agrupa las skills del curso.
 *      - Las Skills declaradas por los bloques evaluables (upsert idempotente).
 *      - Curso (estado BORRADOR, pesos/umbrales por defecto).
 *      - Por cada módulo: Modulo + sus Secciones + sus Bloques (orden explícito
 *        por aparición en el MD) + `SeccionSkill` por sección.
 *      - CursoModuloHabilitado en el orden del MD.
 *      - `CursoSkillExigida` (unión de las SeccionSkill) + `CursoAreaExigida`.
 *  4. Devolver contadores e id del curso creado.
 *
 * El área + skills + exigidas son lo que permite que el curso ENTRE al plan de
 * estudio: sin `SeccionSkill`/`CursoSkillExigida` el motor descarta todas las
 * secciones y el % / los checks verdes nunca se mueven (ver importar-curso.helpers).
 *
 * Bloques `CODIGO` del MD se desempareja en dos `Bloque` consecutivos:
 *  - primero `CODIGO_PREGUNTAS` (orden N, esEvaluable=true),
 *  - luego `CODIGO_TESTS` (orden N+1, esEvaluable=false) apuntando al UUID
 *    del CODIGO_PREGUNTAS hermano via `contenido.codigoPreguntasId`.
 */
@Injectable()
export class ImportarCursoService {
  private readonly logger = new Logger(ImportarCursoService.name)

  constructor(private readonly prisma: PrismaService) {}

  async importar(body: ImportarCursoBody): Promise<ImportarCursoResponse> {
    const parsed = this.parsearOExplotar(body.contenidoMd)
    const clienteId = await this.resolverClienteOExplotar(parsed.curso.cliente)
    return await this.persistir(parsed, clienteId)
  }

  private parsearOExplotar(contenidoMd: string): ImportarCursoInput {
    try {
      return parsearCursoMd(contenidoMd)
    } catch (err) {
      if (err instanceof ParserCursoMdError) {
        throw new BadRequestException({
          code: apiErrorCodes.invalidBody,
          message: err.message,
        })
      }
      throw err
    }
  }

  private async resolverClienteOExplotar(nombreCliente: string): Promise<string> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { nombre: nombreCliente },
      select: { id: true },
    })
    if (!cliente) {
      throw new NotFoundException({
        code: apiErrorCodes.clienteNoEncontrado,
        message: `Cliente "${nombreCliente}" no encontrado. Crea el cliente antes de importar el curso.`,
      })
    }
    return cliente.id
  }

  private async persistir(
    parsed: ImportarCursoInput,
    clienteId: string,
  ): Promise<ImportarCursoResponse> {
    let totalSecciones = 0
    let totalBloques = 0

    let cursoId: string
    try {
      cursoId = await this.prisma.$transaction(
        async (tx) => {
          const areaId = await this.asegurarArea(tx, parsed.curso.titulo)
          const skillPorEtiqueta = await this.asegurarSkills(tx, parsed, areaId)

          const curso = await tx.curso.create({
            data: {
              titulo: parsed.curso.titulo,
              clienteId,
              fechaInicio: this.aFechaUtc(parsed.curso.fechaInicio),
              fechaDeadline: this.aFechaUtc(parsed.curso.fechaDeadline),
              ...(parsed.curso.desbloqueo ? { desbloqueo: parsed.curso.desbloqueo } : {}),
            },
            select: { id: true },
          })

          // Acumuladores para escribir las relaciones en lote (`createMany`) y
          // no encadenar cientos de INSERT dentro de la transacción (evita
          // rozar el TX_TIMEOUT en cursos grandes). Los bloques siguen creándose
          // de a uno porque CODIGO/SQL necesitan el id del bloque padre.
          const seccionSkillRows: Prisma.SeccionSkillCreateManyInput[] = []
          const habilitados: Prisma.CursoModuloHabilitadoCreateManyInput[] = []
          // Etiquetas de skill que terminan asignadas como `SeccionSkill`. Su
          // unión es el conjunto de skills exigidas del curso.
          const exigidas = new Set<string>()

          for (const [idxModulo, modulo] of parsed.modulos.entries()) {
            const moduloPersistido = await this.persistirModulo(
              tx,
              modulo,
              skillPorEtiqueta,
              seccionSkillRows,
              exigidas,
            )
            habilitados.push({
              cursoId: curso.id,
              moduloId: moduloPersistido.moduloId,
              orden: idxModulo,
            })
            totalSecciones += moduloPersistido.totalSecciones
            totalBloques += moduloPersistido.totalBloques
          }

          await tx.cursoModuloHabilitado.createMany({ data: habilitados })
          if (seccionSkillRows.length > 0) {
            await tx.seccionSkill.createMany({ data: seccionSkillRows })
          }
          await this.persistirExigidas(tx, curso.id, areaId, exigidas, skillPorEtiqueta)

          return curso.id
        },
        { timeout: TX_TIMEOUT_MS, maxWait: TX_MAX_WAIT_MS },
      )
    } catch (err) {
      throw this.aHttpErrorPrismaConocido(err)
    }

    this.logger.log(
      `Curso importado | cursoId=${cursoId} | modulos=${parsed.modulos.length} | secciones=${totalSecciones} | bloques=${totalBloques}`,
    )

    return {
      cursoId,
      modulosCreados: parsed.modulos.length,
      seccionesCreadas: totalSecciones,
      bloquesCreados: totalBloques,
    }
  }

  /**
   * Asegura (upsert idempotente) el Área que agrupa las skills del curso. El
   * nombre = título del curso. Si ya existe (reimportación), la reutiliza.
   */
  private async asegurarArea(tx: Prisma.TransactionClient, nombre: string): Promise<string> {
    const area = await tx.area.upsert({
      where: { nombre },
      create: { nombre },
      update: {},
      select: { id: true },
    })
    return area.id
  }

  /**
   * Asegura (upsert idempotente) todas las skills declaradas por los bloques
   * evaluables del `.md` y devuelve el mapa `etiqueta → id`. Skills nuevas
   * cuelgan del área del curso; las pre-existentes (por `etiquetaVisible`
   * @unique) se reutilizan tal cual (no se mueven de área).
   */
  private async asegurarSkills(
    tx: Prisma.TransactionClient,
    parsed: ImportarCursoInput,
    areaId: string,
  ): Promise<ReadonlyMap<string, string>> {
    const etiquetas = new Set<string>()
    for (const modulo of parsed.modulos) {
      for (const seccion of modulo.secciones) {
        for (const etiqueta of etiquetasEvaluablesDeSeccion(seccion)) {
          etiquetas.add(etiqueta)
        }
      }
    }

    const mapa = new Map<string, string>()
    for (const etiqueta of etiquetas) {
      const skill = await tx.skill.upsert({
        where: { etiquetaVisible: etiqueta },
        create: { etiquetaVisible: etiqueta, areaId },
        update: {},
        select: { id: true },
      })
      mapa.set(etiqueta, skill.id)
    }
    return mapa
  }

  private aHttpErrorPrismaConocido(err: unknown): Error {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return new ConflictException({
          code: apiErrorCodes.conflict,
          message:
            "Ya existe un recurso con los mismos identificadores (curso, módulo o habilitación duplicada).",
        })
      }
      if (err.code === "P2003") {
        return new BadRequestException({
          code: apiErrorCodes.invalidBody,
          message: "Referencia inválida: alguna FK del payload no existe en base de datos.",
        })
      }
    }
    return err instanceof Error ? err : new Error(String(err))
  }

  private async persistirModulo(
    tx: Prisma.TransactionClient,
    modulo: ModuloImportado,
    skillPorEtiqueta: ReadonlyMap<string, string>,
    seccionSkillRows: Prisma.SeccionSkillCreateManyInput[],
    exigidas: Set<string>,
  ): Promise<{ moduloId: string; totalSecciones: number; totalBloques: number }> {
    const moduloRow = await tx.modulo.create({
      data: {
        titulo: modulo.titulo,
        descripcion: modulo.descripcion || null,
      },
      select: { id: true },
    })

    const representante = representanteDeModulo(modulo)

    let totalBloques = 0
    for (const [idxSeccion, seccion] of modulo.secciones.entries()) {
      const totalEnSeccion = await this.persistirSeccion(
        tx,
        moduloRow.id,
        seccion,
        idxSeccion,
        skillPorEtiqueta,
        representante,
        seccionSkillRows,
        exigidas,
      )
      totalBloques += totalEnSeccion
    }

    return {
      moduloId: moduloRow.id,
      totalSecciones: modulo.secciones.length,
      totalBloques,
    }
  }

  private async persistirSeccion(
    tx: Prisma.TransactionClient,
    moduloId: string,
    seccion: SeccionImportada,
    ordenSeccion: number,
    skillPorEtiqueta: ReadonlyMap<string, string>,
    representanteModulo: string | null,
    seccionSkillRows: Prisma.SeccionSkillCreateManyInput[],
    exigidas: Set<string>,
  ): Promise<number> {
    const seccionRow = await tx.seccion.create({
      data: { moduloId, titulo: seccion.titulo, orden: ordenSeccion },
      select: { id: true },
    })

    this.acumularSeccionSkills(
      seccionRow.id,
      seccion,
      skillPorEtiqueta,
      representanteModulo,
      seccionSkillRows,
      exigidas,
    )

    let orden = 0
    let totalBloques = 0
    for (const bloqueDef of seccion.bloques) {
      const creados = await this.persistirBloque(
        tx,
        seccionRow.id,
        bloqueDef,
        orden,
        skillPorEtiqueta,
      )
      orden += creados
      totalBloques += creados
    }
    return totalBloques
  }

  /**
   * Acumula las filas `SeccionSkill` de una sección (skills concretas propias o
   * el representante del módulo si no tiene ninguna) en el buffer de inserción
   * en lote, y registra esas etiquetas en el set de exigidas del curso. No toca
   * la BD: la escritura se hace con `createMany` al final de la transacción.
   */
  private acumularSeccionSkills(
    seccionId: string,
    seccion: SeccionImportada,
    skillPorEtiqueta: ReadonlyMap<string, string>,
    representanteModulo: string | null,
    seccionSkillRows: Prisma.SeccionSkillCreateManyInput[],
    exigidas: Set<string>,
  ): void {
    for (const etiqueta of etiquetasSkillDeSeccion(seccion, representanteModulo)) {
      const skillId = skillPorEtiqueta.get(etiqueta)
      if (!skillId) {
        // Toda etiqueta declarada se aseguró antes; esto no debería ocurrir.
        continue
      }
      seccionSkillRows.push({ seccionId, skillId })
      exigidas.add(etiqueta)
    }
  }

  /**
   * Persiste las skills exigidas del curso (`CursoSkillExigida`, unión de las
   * SeccionSkill) y su única área exigida (`CursoAreaExigida`, peso 100) para
   * que el curso sea publicable por el endpoint real de publicación.
   */
  private async persistirExigidas(
    tx: Prisma.TransactionClient,
    cursoId: string,
    areaId: string,
    exigidas: ReadonlySet<string>,
    skillPorEtiqueta: ReadonlyMap<string, string>,
  ): Promise<void> {
    const exigidasRows: Prisma.CursoSkillExigidaCreateManyInput[] = []
    for (const etiqueta of exigidas) {
      const skillId = skillPorEtiqueta.get(etiqueta)
      if (skillId) {
        exigidasRows.push({ cursoId, skillId, notaMinima: NOTA_MINIMA_SKILL })
      }
    }
    if (exigidasRows.length > 0) {
      await tx.cursoSkillExigida.createMany({ data: exigidasRows })
    }

    await tx.cursoAreaExigida.create({
      data: { cursoId, areaId, peso: AREA_PESO, puntajeObjetivo: PUNTAJE_OBJETIVO },
    })
  }

  /**
   * Persiste un bloque del MD. Para tipos simples crea 1 fila; para CODIGO
   * crea 2 filas (CODIGO_PREGUNTAS + CODIGO_TESTS). Devuelve cuántas filas
   * creó para que la sección siga numerando el `orden` correctamente.
   */
  private async persistirBloque(
    tx: Prisma.TransactionClient,
    seccionId: string,
    bloque: BloqueImportado,
    ordenBase: number,
    skillPorEtiqueta: ReadonlyMap<string, string>,
  ): Promise<number> {
    if (bloque.tipo === "CODIGO") {
      const preguntas = await tx.bloque.create({
        data: {
          seccionId,
          orden: ordenBase,
          tipo: TipoBloque.CODIGO_PREGUNTAS,
          esEvaluable: true,
          skillQueMideId: this.skillIdDe(skillPorEtiqueta, bloque.skillEtiqueta),
          contenido: bloque.contenidoReto as Prisma.InputJsonValue,
        },
        select: { id: true },
      })
      await tx.bloque.create({
        data: {
          seccionId,
          orden: ordenBase + 1,
          tipo: TipoBloque.CODIGO_TESTS,
          esEvaluable: false,
          contenido: {
            codigoPreguntasId: preguntas.id,
            solucionReferencia: bloque.solucionReferencia,
            tests: bloque.tests,
          } satisfies Prisma.InputJsonObject,
        },
      })
      return 2
    }

    if (bloque.tipo === "SQL") {
      const ejercicio = await tx.bloque.create({
        data: {
          seccionId,
          orden: ordenBase,
          tipo: TipoBloque.SQL_EJERCICIO,
          esEvaluable: true,
          skillQueMideId: this.skillIdDe(skillPorEtiqueta, bloque.skillEtiqueta),
          contenido: bloque.contenidoReto as Prisma.InputJsonValue,
        },
        select: { id: true },
      })
      await tx.bloque.create({
        data: {
          seccionId,
          orden: ordenBase + 1,
          tipo: TipoBloque.SQL_TESTS,
          esEvaluable: false,
          contenido: {
            sqlEjercicioId: ejercicio.id,
            tests: bloque.tests,
          } satisfies Prisma.InputJsonObject,
        },
      })
      return 2
    }

    const tipoPrisma = TipoBloque[bloque.tipo as keyof typeof TipoBloque]
    const esEvaluable = bloque.tipo === "QUIZ"
    const skillQueMideId =
      bloque.tipo === "QUIZ" ? this.skillIdDe(skillPorEtiqueta, bloque.skillEtiqueta) : null
    await tx.bloque.create({
      data: {
        seccionId,
        orden: ordenBase,
        tipo: tipoPrisma,
        esEvaluable,
        skillQueMideId,
        contenido: bloque.contenido as Prisma.InputJsonValue,
      },
    })
    return 1
  }

  /**
   * Traduce la etiqueta de skill declarada en el `.md` a su id. El mapa ya
   * asegura toda etiqueta declarada, así que un `undefined` aquí solo ocurre si
   * el bloque no declaró skill → `null`.
   */
  private skillIdDe(
    skillPorEtiqueta: ReadonlyMap<string, string>,
    etiqueta: string | undefined,
  ): string | null {
    if (!etiqueta) {
      return null
    }
    return skillPorEtiqueta.get(etiqueta) ?? null
  }

  private aFechaUtc(yyyyMmDd: string): Date {
    return new Date(`${yyyyMmDd}T00:00:00.000Z`)
  }
}
