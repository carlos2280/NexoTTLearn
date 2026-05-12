import { createHash } from "node:crypto"
import { Inject, Injectable, Logger, forwardRef } from "@nestjs/common"
import { RolUsuario } from "@prisma/client"
import { AiService } from "../common/ai/ai.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { TransversalService } from "./transversal.service"

/**
 * `JobEvaluacionTransversalService` — esqueleto P8a + integracion real P8b
 * (D-S8-B5, R-S8-4).
 *
 * Cola en memoria (Set + FIFO) que despacha jobs de evaluacion del intento
 * transversal hacia el `AiService` (mock o Claude segun env). En P8b el job
 * persiste las capas via los endpoints internos del propio service
 * (`cargarCapaCualitativa` / `cargarCapaComprension`) con
 * `Idempotency-Key` UUID v5 derivada del par `(intentoId, capa)`. Esto cierra
 * §5.111 (worker IA real).
 *
 * Diseno deliberado:
 *  - `dispatch(intentoId)` es sincrono y fire-and-forget. La TX del POST no
 *    debe bloquearse esperando IA.
 *  - Concurrencia maxima `CONCURRENCIA_MAX` (§15.10): si supera, encola en
 *    array FIFO y libera un slot al terminar cada job.
 *  - **Nunca** loggea contenido del repo, transcripcion ni payload de IA.
 *    Solo metadatos: intentoId, duracion, capa calculada (R-S8-10).
 *  - Si Claude falla aguas abajo (R-S8-2, R-S8-6), el job loggea el error
 *    pero NO transitiona el intento: el admin puede reintentar manualmente o
 *    cargar la capa via endpoint admin con override.
 */
const JOB_DELAY_MS = 2000
const CONCURRENCIA_MAX = 10
const PROFUNDIDAD_MOCK = "SEMI_SENIOR" as const
const NOTA_CAPA_TESTS_MOCK = 70
const TURNOS_COMPRENSION_MAX = 5
// Namespace estable UUID v5 para derivar Idempotency-Key del par
// `(intentoId, capa)`. Cualquier UUID v4 constante sirve; este es generado
// una vez y no rota.
const IDEMPOTENCY_NAMESPACE = "3e7a4f1e-cb52-4b1e-9c5f-7f0b8e2d4a01"

@Injectable()
export class JobEvaluacionTransversalService {
  private readonly logger = new Logger(JobEvaluacionTransversalService.name)
  private readonly enCurso = new Set<string>()
  private readonly pendientes: string[] = []

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    @Inject(forwardRef(() => TransversalService))
    private readonly transversal: TransversalService,
  ) {}

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

  get estadoCola(): { readonly enCurso: number; readonly pendientes: number } {
    return { enCurso: this.enCurso.size, pendientes: this.pendientes.length }
  }

  private async procesar(intentoId: string): Promise<void> {
    this.enCurso.add(intentoId)
    const inicio = Date.now()
    try {
      await this.esperar(JOB_DELAY_MS)
      const intento = await this.cargarIntentoParaJob(intentoId)
      if (!intento) {
        return
      }
      const sesionInterna = this.sesionWorker(intento.colaboradorId)

      if (intento.transversal.capaTestsActiva) {
        await this.cargarCapaTestsSeguro(intentoId, sesionInterna)
      }
      await this.cargarCapaCualitativaSeguro(intentoId, intento.repoUrl, sesionInterna)
      await this.cargarCapaComprensionSeguro(intentoId, intento.repoUrl, sesionInterna)

      this.logger.log(
        `Intento ${intentoId} evaluado en ${Date.now() - inicio}ms (provider=${this.ai.providerName}).`,
      )
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.error(`Fallo job para intento ${intentoId}: ${detalle}`)
    } finally {
      this.enCurso.delete(intentoId)
      this.drenarPendiente()
    }
  }

  private async cargarIntentoParaJob(intentoId: string): Promise<{
    readonly repoUrl: string
    readonly colaboradorId: string
    readonly transversal: { readonly capaTestsActiva: boolean }
  } | null> {
    const intento = await this.prisma.intentoTransversal.findUnique({
      where: { id: intentoId },
      select: {
        repoUrl: true,
        estado: true,
        colaboradorId: true,
        transversal: { select: { capaTestsActiva: true } },
      },
    })
    if (!intento || intento.repoUrl === null) {
      this.logger.warn(`Intento ${intentoId} no encontrado o sin repo_url; se omite job.`)
      return null
    }
    if (intento.estado !== "EN_EVALUACION") {
      this.logger.warn(
        `Intento ${intentoId} no esta en EN_EVALUACION (actual=${intento.estado}); skip.`,
      )
      return null
    }
    return {
      repoUrl: intento.repoUrl,
      colaboradorId: intento.colaboradorId,
      transversal: intento.transversal,
    }
  }

  private async cargarCapaTestsSeguro(intentoId: string, sesion: SesionUsuario): Promise<void> {
    try {
      await this.transversal.cargarCapaTests({
        intentoId,
        body: { nota: NOTA_CAPA_TESTS_MOCK, detalle: { fuente: "worker-mvp" } },
        idempotencyKey: this.derivarKey(intentoId, "tests"),
        usuario: sesion,
      })
    } catch (error) {
      this.logCapaFallo("tests", intentoId, error)
    }
  }

  private async cargarCapaCualitativaSeguro(
    intentoId: string,
    repoUrl: string,
    sesion: SesionUsuario,
  ): Promise<void> {
    try {
      const cualitativa = await this.ai.evaluarRepoCualitativo({
        repoUrl,
        profundidad: PROFUNDIDAD_MOCK,
      })
      await this.transversal.cargarCapaCualitativa({
        intentoId,
        body: {
          nota: cualitativa.nota,
          detalle: {
            comentario: cualitativa.comentario.slice(0, 4000),
            confianza: confianzaAUpper(cualitativa.confianza),
          },
        },
        idempotencyKey: this.derivarKey(intentoId, "cualitativa"),
        usuario: sesion,
      })
    } catch (error) {
      this.logCapaFallo("cualitativa", intentoId, error)
    }
  }

  private async cargarCapaComprensionSeguro(
    intentoId: string,
    repoUrl: string,
    sesion: SesionUsuario,
  ): Promise<void> {
    try {
      const transcripcion: Array<{ rol: "asistente" | "colaborador"; texto: string }> = []
      let comprensionNota: number | null = null
      for (let turno = 0; turno < TURNOS_COMPRENSION_MAX; turno += 1) {
        const respuesta = await this.ai.mantenerTurnoComprension({
          repoUrl,
          profundidad: PROFUNDIDAD_MOCK,
          turnoIndex: turno,
          transcripcionPrevia: transcripcion,
        })
        if (respuesta.finalizado) {
          comprensionNota = respuesta.nota
          break
        }
        if (respuesta.siguientePregunta !== null) {
          transcripcion.push({ rol: "asistente", texto: respuesta.siguientePregunta })
        }
      }
      if (comprensionNota === null) {
        return
      }
      await this.transversal.cargarCapaComprension({
        intentoId,
        body: {
          nota: comprensionNota,
          detalle: {
            transcripcion: transcripcion.map((t) => ({
              rol: t.rol === "asistente" ? ("ASISTENTE" as const) : ("COLABORADOR" as const),
              mensaje: t.texto.slice(0, 4000),
            })),
          },
        },
        idempotencyKey: this.derivarKey(intentoId, "comprension"),
        usuario: sesion,
      })
    } catch (error) {
      this.logCapaFallo("comprension", intentoId, error)
    }
  }

  private logCapaFallo(capa: string, intentoId: string, error: unknown): void {
    this.logger.warn(
      `cargarCapa ${capa} fallo intento=${intentoId}: ${
        error instanceof Error ? error.message : "?"
      }`,
    )
  }

  /**
   * Sesion sintetica del worker — el `usuarioId` apunta al colaborador para
   * que las idempotency keys queden trazables por intento. El service de
   * carga no usa `usuario.rol` para autorizar (los guards del controller lo
   * resuelven); el worker llama metodos del service directamente.
   */
  private sesionWorker(colaboradorId: string): SesionUsuario {
    return { usuarioId: colaboradorId, rol: RolUsuario.ADMIN }
  }

  /**
   * Deriva una `Idempotency-Key` UUID-shape determinista a partir del par
   * `(intentoId, capa)` usando SHA-1 + el namespace fijo (algoritmo simil
   * UUID v5). Sin dep externa: cumplimos `z.string().uuid()` produciendo el
   * shape `xxxxxxxx-xxxx-5xxx-Nxxx-xxxxxxxxxxxx` con `N in [89ab]`.
   */
  private derivarKey(intentoId: string, capa: "tests" | "cualitativa" | "comprension"): string {
    const hash = createHash("sha1")
      .update(IDEMPOTENCY_NAMESPACE.replace(/-/g, ""), "hex")
      .update(`${intentoId}:${capa}`)
      .digest("hex")
    const hex = hash.slice(0, 32)
    const timeLow = hex.slice(0, 8)
    const timeMid = hex.slice(8, 12)
    const timeHiVersion = `5${hex.slice(13, 16)}`
    const variantNibble = (Number.parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8
    const clockSeq = `${variantNibble.toString(16)}${hex.slice(17, 20)}`
    const node = hex.slice(20, 32)
    return `${timeLow}-${timeMid}-${timeHiVersion}-${clockSeq}-${node}`
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

function confianzaAUpper(c: "alta" | "media" | "baja"): "ALTA" | "MEDIA" | "BAJA" {
  if (c === "alta") {
    return "ALTA"
  }
  if (c === "media") {
    return "MEDIA"
  }
  return "BAJA"
}
