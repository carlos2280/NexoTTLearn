import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common"
import {
  type ContenidoCodigoPreguntas,
  type LenguajeEjecutable,
  type ResultadoTestReportado,
  type TestStdinStdout,
  contenidoCodigoPreguntasSchema,
  contenidoCodigoTestsSchema,
  lenguajeEjecutableSchema,
} from "@nexott-learn/shared-types"
import type { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import type { CalculoQuizResultado } from "./intentos-bloque.types"

/**
 * Resultado por test que se persiste en `IntentoBloque.respuestas` para que
 * el participante y el admin puedan ver el detalle del intento. Combina lo
 * declarado por el cliente con la `salidaEsperada` y metadatos `descripcion`
 * y `visible` que toma autoritativamente del bloque `CODIGO_TESTS`.
 */
export interface ResultadoTestPersistido {
  readonly testId: string
  readonly descripcion: string
  readonly visible: boolean
  readonly paso: boolean
  readonly estado: "ok" | "timeout" | "fallo"
  readonly stdoutObtenido: string
  readonly stdoutEsperado: string
  readonly stderr: string
  readonly duracionMs: number
}

interface BloqueCodigoPreguntasMinimo {
  readonly id: string
  readonly seccionId: string
  readonly contenido: Prisma.JsonValue
}

@Injectable()
export class CodigoEvaluadorService {
  private readonly logger = new Logger(CodigoEvaluadorService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida y persiste un intento de `CODIGO_PREGUNTAS`. La ejecucion del
   * codigo del participante ocurre en el navegador (Pyodide para Python,
   * Web Worker para JS/TS). El cliente reporta los resultados por test y este
   * service:
   *
   *  1. Parsea el contenido del bloque `CODIGO_PREGUNTAS`.
   *  2. Localiza el bloque `CODIGO_TESTS` hermano.
   *  3. Verifica que los `testId` reportados por el cliente coinciden
   *     exactamente con los del bloque `CODIGO_TESTS` (ni menos ni extra).
   *  4. Calcula la nota = (testsPasados / total) * 100. NUNCA confia en una
   *     nota agregada que envie el cliente: el cliente solo dice "pasa/no"
   *     por test y el backend recuenta.
   *  5. Devuelve los resultados enriquecidos con `descripcion`, `visible` y
   *     `salidaEsperada` autoritativos del bloque, para auditoria.
   *
   * Errores 500 (responsabilidad del editor del admin):
   *  - El contenido del CODIGO_PREGUNTAS no parsea (`contenidoBloqueInvalido`).
   *  - `modoSimple=true` — sin auto-correccion posible.
   *  - El lenguaje no es ejecutable (no soportado por los runners del cliente).
   *  - No hay CODIGO_TESTS hermano que apunte a este bloque.
   *  - El contenido del CODIGO_TESTS no parsea.
   *
   * Errores 400 (responsabilidad del cliente):
   *  - `resultadosTests` tiene `testId` que no existen en el bloque.
   *  - `resultadosTests` no cubre todos los `testId` del bloque.
   *  - `resultadosTests` tiene `testId` duplicados.
   */
  async evaluar(input: {
    readonly bloque: BloqueCodigoPreguntasMinimo
    readonly codigoEnviado: string
    readonly resultadosReportados: readonly ResultadoTestReportado[]
  }): Promise<{
    readonly calculo: CalculoQuizResultado
    readonly resultadosTests: readonly ResultadoTestPersistido[]
    readonly lenguaje: LenguajeEjecutable
  }> {
    const contenido = this.parsearContenidoPreguntas(input.bloque.contenido)
    if (contenido.modoSimple) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.contenidoBloqueInvalido,
        message: "CODIGO_PREGUNTAS en modoSimple no admite auto-correccion.",
      })
    }
    const lenguajeParse = lenguajeEjecutableSchema.safeParse(contenido.lenguaje)
    if (!lenguajeParse.success) {
      throw new InternalServerErrorException({
        code: apiErrorCodes.contenidoBloqueInvalido,
        message: `Lenguaje ${contenido.lenguaje} no es ejecutable por los runners del cliente.`,
      })
    }
    const lenguaje = lenguajeParse.data

    const tests = await this.localizarTests(input.bloque)
    const reportadosPorId = this.indexarReportados(input.resultadosReportados)
    this.validarCoberturaTests(tests, reportadosPorId)

    const resultadosTests: ResultadoTestPersistido[] = []
    let testsPasados = 0
    for (const test of tests) {
      // El index lo construye `indexarReportados` con todos los `testId` del
      // bloque (verificado por `validarCoberturaTests`); el cast es seguro.
      const reportado = reportadosPorId.get(test.id) as ResultadoTestReportado
      if (reportado.paso) {
        testsPasados += 1
      }
      resultadosTests.push({
        testId: test.id,
        descripcion: test.descripcion,
        visible: test.visible,
        paso: reportado.paso,
        estado: reportado.estado,
        stdoutObtenido: reportado.stdoutObtenido,
        stdoutEsperado: test.salidaEsperada,
        stderr: reportado.stderr,
        duracionMs: reportado.duracionMs,
      })
    }

    const puntosTotales = tests.length
    const puntosObtenidos = testsPasados
    const notaRaw = (puntosObtenidos / puntosTotales) * 100
    const nota = Math.round(notaRaw * 100) / 100
    return {
      calculo: { nota, puntosObtenidos, puntosTotales },
      resultadosTests,
      lenguaje,
    }
  }

  private parsearContenidoPreguntas(contenido: Prisma.JsonValue): ContenidoCodigoPreguntas {
    const parsed = contenidoCodigoPreguntasSchema.safeParse(contenido)
    if (!parsed.success) {
      this.logger.warn(`CODIGO_PREGUNTAS shape invalido: ${parsed.error.issues.length} issues`)
      throw new InternalServerErrorException({
        code: apiErrorCodes.contenidoBloqueInvalido,
        message: "El bloque CODIGO_PREGUNTAS tiene un contenido con shape invalido.",
      })
    }
    return parsed.data
  }

  private async localizarTests(
    bloque: BloqueCodigoPreguntasMinimo,
  ): Promise<readonly TestStdinStdout[]> {
    // El bloque CODIGO_TESTS hermano vive en la MISMA seccion y su contenido
    // JSON tiene `codigoPreguntasId === bloque.id`. Hacemos un findMany por
    // tipo+seccion y filtramos en memoria (el numero de bloques por seccion
    // es bajo, no justifica un GIN index sobre JSONB todavia).
    const candidatos = await this.prisma.bloque.findMany({
      where: {
        seccionId: bloque.seccionId,
        tipo: "CODIGO_TESTS",
        estado: "ACTIVO",
      },
      select: { id: true, contenido: true },
    })
    for (const candidato of candidatos) {
      const parsed = contenidoCodigoTestsSchema.safeParse(candidato.contenido)
      if (!parsed.success) {
        continue
      }
      if (parsed.data.codigoPreguntasId === bloque.id) {
        return parsed.data.tests
      }
    }
    throw new InternalServerErrorException({
      code: apiErrorCodes.contenidoBloqueInvalido,
      message: "No hay bloque CODIGO_TESTS asociado a este reto.",
    })
  }

  private indexarReportados(
    reportados: readonly ResultadoTestReportado[],
  ): Map<string, ResultadoTestReportado> {
    const indice = new Map<string, ResultadoTestReportado>()
    for (const reportado of reportados) {
      if (indice.has(reportado.testId)) {
        throw new BadRequestException({
          code: apiErrorCodes.invalidBody,
          message: `Test ${reportado.testId} reportado mas de una vez.`,
        })
      }
      indice.set(reportado.testId, reportado)
    }
    return indice
  }

  private validarCoberturaTests(
    tests: readonly TestStdinStdout[],
    reportadosPorId: ReadonlyMap<string, ResultadoTestReportado>,
  ): void {
    const idsEsperados = new Set(tests.map((t) => t.id))
    const idsReportados = new Set(reportadosPorId.keys())

    const faltantes: string[] = []
    for (const id of idsEsperados) {
      if (!idsReportados.has(id)) {
        faltantes.push(id)
      }
    }
    if (faltantes.length > 0) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: `Faltan resultados de tests: ${faltantes.join(", ")}.`,
      })
    }

    const extra: string[] = []
    for (const id of idsReportados) {
      if (!idsEsperados.has(id)) {
        extra.push(id)
      }
    }
    if (extra.length > 0) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: `Resultados de tests que no pertenecen al bloque: ${extra.join(", ")}.`,
      })
    }
  }
}
