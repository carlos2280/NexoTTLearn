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
import { ParserCursoMdError, parsearCursoMd } from "./parser-md"

// Cursos completos pueden tener docenas de módulos × secciones × bloques.
// El default de 5s no alcanza; subimos a 30s con margen de espera amplio.
const TX_TIMEOUT_MS = 30_000
const TX_MAX_WAIT_MS = 10_000

/**
 * Persiste un curso completo (curso + módulos + secciones + bloques +
 * habilitaciones) desde un `.md` enviado por el admin. El flujo es:
 *
 *  1. Parsear el MD a `ImportarCursoInput` (parser + Zod final).
 *  2. Resolver el cliente por nombre (`cliente: "NTT Data Iberia"` ↦ id).
 *  3. Abrir transacción Prisma y crear:
 *      - Curso (estado BORRADOR, pesos/umbrales por defecto).
 *      - Por cada módulo: Modulo + sus Secciones + sus Bloques (orden
 *        explícito por aparición en el MD).
 *      - CursoModuloHabilitado en el orden del MD.
 *  4. Devolver contadores e id del curso creado.
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

          for (const [idxModulo, modulo] of parsed.modulos.entries()) {
            const moduloPersistido = await this.persistirModulo(tx, modulo)
            await tx.cursoModuloHabilitado.create({
              data: {
                cursoId: curso.id,
                moduloId: moduloPersistido.moduloId,
                orden: idxModulo,
              },
            })
            totalSecciones += moduloPersistido.totalSecciones
            totalBloques += moduloPersistido.totalBloques
          }

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
  ): Promise<{ moduloId: string; totalSecciones: number; totalBloques: number }> {
    const moduloRow = await tx.modulo.create({
      data: {
        titulo: modulo.titulo,
        descripcion: modulo.descripcion || null,
      },
      select: { id: true },
    })

    let totalBloques = 0
    for (const [idxSeccion, seccion] of modulo.secciones.entries()) {
      const totalEnSeccion = await this.persistirSeccion(tx, moduloRow.id, seccion, idxSeccion)
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
  ): Promise<number> {
    const seccionRow = await tx.seccion.create({
      data: { moduloId, titulo: seccion.titulo, orden: ordenSeccion },
      select: { id: true },
    })

    let orden = 0
    let totalBloques = 0
    for (const bloqueDef of seccion.bloques) {
      const creados = await this.persistirBloque(tx, seccionRow.id, bloqueDef, orden)
      orden += creados
      totalBloques += creados
    }
    return totalBloques
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
  ): Promise<number> {
    if (bloque.tipo === "CODIGO") {
      const preguntas = await tx.bloque.create({
        data: {
          seccionId,
          orden: ordenBase,
          tipo: TipoBloque.CODIGO_PREGUNTAS,
          esEvaluable: true,
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

    const tipoPrisma = TipoBloque[bloque.tipo as keyof typeof TipoBloque]
    const esEvaluable = bloque.tipo === "QUIZ"
    await tx.bloque.create({
      data: {
        seccionId,
        orden: ordenBase,
        tipo: tipoPrisma,
        esEvaluable,
        contenido: bloque.contenido as Prisma.InputJsonValue,
      },
    })
    return 1
  }

  private aFechaUtc(yyyyMmDd: string): Date {
    return new Date(`${yyyyMmDd}T00:00:00.000Z`)
  }
}
