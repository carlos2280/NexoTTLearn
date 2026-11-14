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
import { AccionLogCurso, EstadoCurso, EstadoModulo, Prisma, TipoBloque } from "@prisma/client"

import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import {
  completarSkillsFaltantes,
  etiquetasEvaluablesDeSeccion,
  etiquetasSkillDeSeccion,
  normalizarNombreCliente,
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
 *  1. Parsear el MD a `ImportarCursoInput` (parser + Zod final) y dar la skill
 *     por defecto del modulo a los evaluables que no declaran `skill=`.
 *  2. Resolver el cliente por nombre normalizado (sin mayusculas, tildes ni
 *     diferencias de guion) ↦ id.
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

  async importar(body: ImportarCursoBody, autorUsuarioId: string): Promise<ImportarCursoResponse> {
    const parsed = completarSkillsFaltantes(this.parsearOExplotar(body.contenidoMd))
    const clienteId = await this.resolverClienteOExplotar(parsed.curso.cliente)
    if (body.reemplazarCursoId) {
      return await this.persistir(parsed, clienteId, {
        tipo: "reemplazar",
        cursoId: body.reemplazarCursoId,
        autorUsuarioId,
      })
    }
    if (body.confirmarDuplicado !== true) {
      await this.explotarSiTituloExiste(parsed.curso.titulo)
    }
    return await this.persistir(parsed, clienteId, { tipo: "nuevo" })
  }

  /**
   * Aviso antes de duplicar (2A): si ya hay un curso con el mismo titulo (sin
   * distinguir mayusculas, en cualquier estado), responde 409 con la lista
   * para que el admin confirme. No es una regla de unicidad: confirmando se
   * crea otro curso igual que antes.
   */
  private async explotarSiTituloExiste(titulo: string): Promise<void> {
    const filas = await this.prisma.curso.findMany({
      where: { titulo: { equals: titulo.trim(), mode: "insensitive" } },
      select: {
        id: true,
        titulo: true,
        estado: true,
        _count: { select: { asignaciones: true, intentosBloque: true } },
      },
      orderBy: { createdAt: "asc" },
    })
    if (filas.length === 0) {
      return
    }
    const existentes = filas.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      estado: c.estado,
      reemplazable: esReemplazable(c),
    }))
    throw new ConflictException({
      code: apiErrorCodes.cursoTituloDuplicado,
      message: `Ya existe un curso llamado "${titulo.trim()}". Si importas, se creará otro con el mismo título.`,
      details: { cursosExistentes: existentes },
    })
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
    const clientes = await this.prisma.cliente.findMany({
      where: { deletedAt: null },
      select: { id: true, nombre: true, activo: true },
      orderBy: { nombre: "asc" },
    })
    const buscado = normalizarNombreCliente(nombreCliente)
    const coincidencias = clientes.filter((c) => normalizarNombreCliente(c.nombre) === buscado)
    const [unico] = coincidencias
    if (unico && coincidencias.length === 1) {
      return unico.id
    }
    const disponibles = clientes
      .filter((c) => c.activo !== false)
      .map((c) => `"${c.nombre}"`)
      .join(", ")
    throw new NotFoundException({
      code: apiErrorCodes.clienteNoEncontrado,
      message: `Cliente "${nombreCliente}" no encontrado. Escribe en "cliente:" uno de los existentes: ${disponibles || "(no hay clientes; crea uno antes de importar)"}.`,
    })
  }

  private async persistir(
    parsed: ImportarCursoInput,
    clienteId: string,
    destino: DestinoImportacion,
  ): Promise<ImportarCursoResponse> {
    let totalSecciones = 0
    let totalBloques = 0

    let cursoId: string
    let modulosArchivados = 0
    try {
      const resultado = await this.prisma.$transaction(
        async (tx) => {
          const datosCurso = {
            titulo: parsed.curso.titulo,
            clienteId,
            fechaInicio: this.aFechaUtc(parsed.curso.fechaInicio),
            fechaDeadline: this.aFechaUtc(parsed.curso.fechaDeadline),
            ...(parsed.curso.desbloqueo ? { desbloqueo: parsed.curso.desbloqueo } : {}),
          }
          let archivados = 0
          let curso: { id: string }
          if (destino.tipo === "reemplazar") {
            // Comprobar y vaciar ANTES de crear nada: si no es reemplazable,
            // la transaccion no deja rastro.
            archivados = await this.vaciarCursoParaReemplazo(tx, destino, parsed.curso.titulo)
            await tx.curso.update({ where: { id: destino.cursoId }, data: datosCurso })
            curso = { id: destino.cursoId }
          } else {
            curso = await tx.curso.create({ data: datosCurso, select: { id: true } })
          }
          const areaId = await this.asegurarArea(tx, parsed.curso.titulo)
          const skillPorEtiqueta = await this.asegurarSkills(tx, parsed, areaId)

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

          if (destino.tipo === "reemplazar") {
            await tx.logCambioCurso.create({
              data: {
                cursoId: curso.id,
                autorUsuarioId: destino.autorUsuarioId,
                accion: AccionLogCurso.CAMBIO_MODULOS,
                motivo: "Contenido reemplazado desde un archivo .md (importar curso).",
                previewImpacto: {
                  modulosArchivados: archivados,
                  modulosNuevos: parsed.modulos.length,
                },
              },
            })
          }

          return { cursoId: curso.id, archivados }
        },
        { timeout: TX_TIMEOUT_MS, maxWait: TX_MAX_WAIT_MS },
      )
      cursoId = resultado.cursoId
      modulosArchivados = resultado.archivados
    } catch (err) {
      throw this.aHttpErrorPrismaConocido(err)
    }

    this.logger.log(
      `Curso ${destino.tipo === "reemplazar" ? "reemplazado" : "importado"} | cursoId=${cursoId} | archivados=${modulosArchivados} | modulos=${parsed.modulos.length} | secciones=${totalSecciones} | bloques=${totalBloques}`,
    )

    return {
      cursoId,
      modulosCreados: parsed.modulos.length,
      seccionesCreadas: totalSecciones,
      bloquesCreados: totalBloques,
      reemplazado: destino.tipo === "reemplazar",
      modulosArchivados,
    }
  }

  /**
   * Reemplazo (2B): comprueba DENTRO de la transaccion que el curso siga en
   * BORRADOR sin asignaciones ni intentos, le quita habilitaciones y exigidas,
   * y archiva (ACTIVO -> ARCHIVADO, con historico) los modulos viejos que ya no
   * quedan en ningun otro curso. Los compartidos solo se desenganchan. Nada se
   * borra de verdad: un modulo archivado se puede desarchivar desde el catalogo.
   * Devuelve cuantos modulos archivo.
   */
  private async vaciarCursoParaReemplazo(
    tx: Prisma.TransactionClient,
    destino: { readonly cursoId: string; readonly autorUsuarioId: string },
    tituloNuevo: string,
  ): Promise<number> {
    const curso = await tx.curso.findUnique({
      where: { id: destino.cursoId },
      select: {
        id: true,
        estado: true,
        _count: { select: { asignaciones: true, intentosBloque: true } },
      },
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: "El curso a reemplazar no existe.",
      })
    }
    if (!esReemplazable(curso)) {
      throw new ConflictException({
        code: apiErrorCodes.cursoNoReemplazable,
        message:
          "Solo se puede reemplazar un curso en borrador, sin personas asignadas y sin respuestas.",
        details: {
          estado: curso.estado,
          asignaciones: curso._count.asignaciones,
          intentos: curso._count.intentosBloque,
        },
      })
    }
    const viejos = await tx.cursoModuloHabilitado.findMany({
      where: { cursoId: destino.cursoId },
      select: { moduloId: true },
    })
    await tx.cursoModuloHabilitado.deleteMany({ where: { cursoId: destino.cursoId } })
    await tx.cursoSkillExigida.deleteMany({ where: { cursoId: destino.cursoId } })
    await tx.cursoAreaExigida.deleteMany({ where: { cursoId: destino.cursoId } })

    let archivados = 0
    for (const { moduloId } of viejos) {
      const enOtrosCursos = await tx.cursoModuloHabilitado.count({ where: { moduloId } })
      if (enOtrosCursos > 0) {
        continue
      }
      const { count } = await tx.modulo.updateMany({
        where: { id: moduloId, estado: EstadoModulo.ACTIVO },
        data: { estado: EstadoModulo.ARCHIVADO },
      })
      if (count === 1) {
        await tx.historicoEstadoModulo.create({
          data: {
            moduloId,
            estadoAnterior: EstadoModulo.ACTIVO,
            estadoNuevo: EstadoModulo.ARCHIVADO,
            autorUsuarioId: destino.autorUsuarioId,
            motivo: `Reemplazado al importar de nuevo el curso "${tituloNuevo}".`,
          },
        })
        archivados += 1
      }
    }
    return archivados
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

type DestinoImportacion =
  | { readonly tipo: "nuevo" }
  | { readonly tipo: "reemplazar"; readonly cursoId: string; readonly autorUsuarioId: string }

/** 2B: solo un curso en BORRADOR, sin asignaciones ni intentos, se reemplaza. */
function esReemplazable(curso: {
  readonly estado: EstadoCurso
  readonly _count: { readonly asignaciones: number; readonly intentosBloque: number }
}): boolean {
  return (
    curso.estado === EstadoCurso.BORRADOR &&
    curso._count.asignaciones === 0 &&
    curso._count.intentosBloque === 0
  )
}
