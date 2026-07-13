import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common"
import {
  type ContenidoSqlEjercicio,
  type ResultadoTestSqlReportado,
  type TestSql,
  contenidoSqlEjercicioSchema,
  contenidoSqlTestsSchema,
} from "@nexott-learn/shared-types"
import type { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import type { CalculoQuizResultado } from "./intentos-bloque.types"

/**
 * Resultado por test que se persiste en `IntentoBloque.respuestas` para que
 * el participante y el admin vean el detalle. Combina lo declarado por el
 * cliente con `descripcion` y `visible` que toma autoritativamente del bloque
 * `SQL_TESTS`.
 */
export interface ResultadoTestSqlPersistido {
  readonly testId: string
  readonly descripcion: string
  readonly visible: boolean
  readonly paso: boolean
  readonly estado: "ok" | "timeout" | "fallo"
  readonly filasObtenidas: string
  readonly error: string
  readonly duracionMs: number
}

interface BloqueSqlEjercicioMinimo {
  readonly id: string
  readonly seccionId: string
  readonly contenido: Prisma.JsonValue
}

/**
 * Valida y persiste un intento de `SQL_EJERCICIO`. La consulta del
 * participante se ejecuta en el navegador (PGlite); el cliente reporta el
 * `paso` por test y este service:
 *
 *  1. Parsea el contenido del `SQL_EJERCICIO`.
 *  2. Localiza el bloque `SQL_TESTS` hermano (mismo `seccionId`, cuyo
 *     `contenido.sqlEjercicioId` apunta a este bloque).
 *  3. Verifica que los `testId` reportados coinciden EXACTAMENTE con los del
 *     bloque `SQL_TESTS` (ni menos, ni extra, ni duplicados).
 *  4. Calcula la nota = (testsPasados / total) * 100. NUNCA confía en una nota
 *     agregada del cliente: recuenta desde los `paso`.
 *  5. Devuelve los resultados enriquecidos con `descripcion` y `visible`
 *     autoritativos del bloque, para auditoría.
 *
 * Espejo de `CodigoEvaluadorService`: el backend NO ejecuta SQL (no tiene
 * PGlite); confía en el `paso` por test y recuenta.
 */
@Injectable()
export class SqlEvaluadorService {
  private readonly logger = new Logger(SqlEvaluadorService.name)

  constructor(private readonly prisma: PrismaService) {}

  async evaluar(input: {
    readonly bloque: BloqueSqlEjercicioMinimo
    readonly consultaEnviada: string
    readonly resultadosReportados: readonly ResultadoTestSqlReportado[]
  }): Promise<{
    readonly calculo: CalculoQuizResultado
    readonly resultadosTests: readonly ResultadoTestSqlPersistido[]
  }> {
    this.parsearContenidoEjercicio(input.bloque.contenido)

    const tests = await this.localizarTests(input.bloque)
    const reportadosPorId = this.indexarReportados(input.resultadosReportados)
    this.validarCoberturaTests(tests, reportadosPorId)

    const resultadosTests: ResultadoTestSqlPersistido[] = []
    let testsPasados = 0
    for (const test of tests) {
      // El index cubre todos los `testId` del bloque (verificado arriba).
      const reportado = reportadosPorId.get(test.id) as ResultadoTestSqlReportado
      if (reportado.paso) {
        testsPasados += 1
      }
      resultadosTests.push({
        testId: test.id,
        descripcion: test.descripcion,
        visible: test.visible,
        paso: reportado.paso,
        estado: reportado.estado,
        filasObtenidas: reportado.filasObtenidas,
        error: reportado.error,
        duracionMs: reportado.duracionMs,
      })
    }

    const puntosTotales = tests.length
    const puntosObtenidos = testsPasados
    const nota = Math.round((puntosObtenidos / puntosTotales) * 100 * 100) / 100
    return {
      calculo: { nota, puntosObtenidos, puntosTotales, preguntasFalladasIds: [] },
      resultadosTests,
    }
  }

  private parsearContenidoEjercicio(contenido: Prisma.JsonValue): ContenidoSqlEjercicio {
    const parsed = contenidoSqlEjercicioSchema.safeParse(contenido)
    if (!parsed.success) {
      this.logger.warn(`SQL_EJERCICIO shape invalido: ${parsed.error.issues.length} issues`)
      throw new InternalServerErrorException({
        code: apiErrorCodes.contenidoBloqueInvalido,
        message: "El bloque SQL_EJERCICIO tiene un contenido con shape invalido.",
      })
    }
    return parsed.data
  }

  private async localizarTests(bloque: BloqueSqlEjercicioMinimo): Promise<readonly TestSql[]> {
    const candidatos = await this.prisma.bloque.findMany({
      where: { seccionId: bloque.seccionId, tipo: "SQL_TESTS", estado: "ACTIVO" },
      select: { id: true, contenido: true },
    })
    for (const candidato of candidatos) {
      const parsed = contenidoSqlTestsSchema.safeParse(candidato.contenido)
      if (!parsed.success) {
        continue
      }
      if (parsed.data.sqlEjercicioId === bloque.id) {
        return parsed.data.tests
      }
    }
    throw new InternalServerErrorException({
      code: apiErrorCodes.contenidoBloqueInvalido,
      message: "No hay bloque SQL_TESTS asociado a este reto.",
    })
  }

  private indexarReportados(
    reportados: readonly ResultadoTestSqlReportado[],
  ): Map<string, ResultadoTestSqlReportado> {
    const indice = new Map<string, ResultadoTestSqlReportado>()
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
    tests: readonly TestSql[],
    reportadosPorId: ReadonlyMap<string, ResultadoTestSqlReportado>,
  ): void {
    const idsEsperados = new Set(tests.map((t) => t.id))
    const idsReportados = new Set(reportadosPorId.keys())

    const faltantes = [...idsEsperados].filter((id) => !idsReportados.has(id))
    if (faltantes.length > 0) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: `Faltan resultados de tests: ${faltantes.join(", ")}.`,
      })
    }

    const extra = [...idsReportados].filter((id) => !idsEsperados.has(id))
    if (extra.length > 0) {
      throw new BadRequestException({
        code: apiErrorCodes.invalidBody,
        message: `Resultados de tests que no pertenecen al bloque: ${extra.join(", ")}.`,
      })
    }
  }
}
