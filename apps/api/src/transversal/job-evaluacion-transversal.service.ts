import { Injectable, Logger } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { AiService } from "../common/ai/ai.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SELECT_INTENTO_TRANSVERSAL_FIELDS } from "./transversal.types"

/**
 * `JobEvaluacionTransversalService` — esqueleto P8a (D-S8-B5, R-S8-4).
 *
 * Cola en memoria (Set + FIFO) que despacha jobs de evaluacion del intento
 * transversal hacia el AiService (en P8a solo MockProvider esta activo, P8b
 * activa Claude real).
 *
 * Diseno deliberado:
 *  - `dispatch(intentoId)` es sincrono y fire-and-forget. La TX del POST no
 *    debe bloquearse esperando IA.
 *  - Concurrencia maxima `CONCURRENCIA_MAX` (§15.10): si supera, encola en
 *    array FIFO y libera un slot al terminar cada job.
 *  - NO usa `@Cron` en P8a: el dispatch viene del propio service del POST.
 *    En P8b conectamos un cron de reconciliacion para reintentar intentos
 *    que quedaron en `EN_EVALUACION > 5min` (R-S8-4).
 *  - **Nunca** loggea contenido del repo, transcripcion ni payload de IA.
 *    Solo metadatos: intentoId, duracion, capa calculada.
 *
 * En P8a el job simula latencia (`setTimeout(JOB_DELAY_MS)`) y persiste 3
 * notas estaticas/mock al pasar la fila a `EVALUADO`. La logica real (parsing
 * de respuesta IA + redistribucion D35 + finalizacion) entra en P8b.
 */
const JOB_DELAY_MS = 2000
const CONCURRENCIA_MAX = 10
const PROFUNDIDAD_MOCK_P8A = "SEMI_SENIOR" as const
const NOTA_CAPA_TESTS_MOCK = 70

@Injectable()
export class JobEvaluacionTransversalService {
  private readonly logger = new Logger(JobEvaluacionTransversalService.name)
  private readonly enCurso = new Set<string>()
  private readonly pendientes: string[] = []

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  /**
   * Encola la evaluacion del intento. Fire-and-forget. Si el slot esta lleno,
   * el intento queda en `pendientes` y se procesa cuando otro libere.
   */
  dispatch(intentoId: string): void {
    if (this.enCurso.has(intentoId) || this.pendientes.includes(intentoId)) {
      return
    }
    if (this.enCurso.size >= CONCURRENCIA_MAX) {
      this.pendientes.push(intentoId)
      return
    }
    this.procesar(intentoId).catch((error: unknown) => {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.error(`Fallo no capturado en dispatch(${intentoId}): ${detalle}`)
    })
  }

  /**
   * Tamanio del bucket interno — usado por tests para verificar saturacion.
   */
  get estadoCola(): { readonly enCurso: number; readonly pendientes: number } {
    return { enCurso: this.enCurso.size, pendientes: this.pendientes.length }
  }

  private async procesar(intentoId: string): Promise<void> {
    this.enCurso.add(intentoId)
    const inicio = Date.now()
    try {
      await this.esperar(JOB_DELAY_MS)
      const intento = await this.prisma.intentoTransversal.findUnique({
        where: { id: intentoId },
        select: { repoUrl: true, estado: true },
      })
      if (!intento || intento.repoUrl === null) {
        this.logger.warn(`Intento ${intentoId} no encontrado o sin repo_url; se omite job mock.`)
        return
      }
      if (intento.estado !== "EN_EVALUACION") {
        this.logger.warn(
          `Intento ${intentoId} no esta en EN_EVALUACION (actual=${intento.estado}); skip.`,
        )
        return
      }

      const cualitativa = await this.ai.evaluarRepoCualitativo({
        repoUrl: intento.repoUrl,
        profundidad: PROFUNDIDAD_MOCK_P8A,
      })

      // Mantenemos 3 turnos de comprension para alinearnos con el ciclo
      // determinista del MockProvider. La transcripcion no se loggea ni se
      // persiste en P8a: la columna `evaluacionesCapas` sigue intacta.
      let comprensionNota: number | null = null
      for (let turno = 0; turno < 4; turno += 1) {
        const respuesta = await this.ai.mantenerTurnoComprension({
          repoUrl: intento.repoUrl,
          profundidad: PROFUNDIDAD_MOCK_P8A,
          turnoIndex: turno,
          transcripcionPrevia: [],
        })
        if (respuesta.finalizado) {
          comprensionNota = respuesta.nota
          break
        }
      }

      await this.prisma.intentoTransversal.update({
        where: { id: intentoId },
        data: {
          notaCapaTests: new Prisma.Decimal(NOTA_CAPA_TESTS_MOCK),
          notaCapaCualitativa: new Prisma.Decimal(cualitativa.nota),
          notaCapaComprension:
            comprensionNota === null ? null : new Prisma.Decimal(comprensionNota),
          estado: "EVALUADO",
        },
        select: SELECT_INTENTO_TRANSVERSAL_FIELDS,
      })

      this.logger.log(
        `Intento ${intentoId} EVALUADO en ${Date.now() - inicio}ms (provider=${
          this.ai.providerName
        }, capas=tests/cualitativa/comprension).`,
      )
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.error(`Fallo job mock para intento ${intentoId}: ${detalle}`)
    } finally {
      this.enCurso.delete(intentoId)
      this.drenarPendiente()
    }
  }

  private drenarPendiente(): void {
    if (this.pendientes.length === 0 || this.enCurso.size >= CONCURRENCIA_MAX) {
      return
    }
    const siguiente = this.pendientes.shift()
    if (siguiente !== undefined) {
      this.procesar(siguiente).catch((error: unknown) => {
        const detalle = error instanceof Error ? error.message : String(error)
        this.logger.error(`Fallo no capturado en drenarPendiente(${siguiente}): ${detalle}`)
      })
    }
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
