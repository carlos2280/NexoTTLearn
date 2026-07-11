import { createHash } from "node:crypto"
import { Injectable, Logger } from "@nestjs/common"
import { RolUsuario } from "@prisma/client"
import { AiService } from "../common/ai/ai.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { RepoFetchService } from "../common/repo-fetch/repo-fetch.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { TransversalCapasService } from "./transversal-capas.service"

/**
 * `JobEvaluacionTransversalService` — evalúa el intento transversal con UNA sola
 * capa: "Revisión con IA" (la cualitativa). Descarga el repo entregado
 * (`RepoFetchService`), lo empaqueta y se lo pasa al `AiService` (mock o Claude
 * según env). Las capas viejas (tests con nota fija, comprensión auto-entrevista)
 * ya NO se corren: colapso a una capa (2026-07-11).
 *
 * Diseño:
 *  - `dispatch(intentoId)` es síncrono y fire-and-forget: la TX del POST no se
 *    bloquea esperando IA.
 *  - Concurrencia máxima `CONCURRENCIA_MAX` (§15.10); el resto encola FIFO.
 *  - **Nunca** loggea contenido del repo ni payload de IA. Solo metadatos.
 *  - Si la descarga o Claude fallan, el job loggea el error pero NO transiciona
 *    el intento: el admin puede reintentar o cargar la capa a mano.
 */
const JOB_DELAY_MS = 2000
const CONCURRENCIA_MAX = 10
// El transversal no tiene un campo de profundidad propio, así que la evaluación
// cualitativa usa SEMI_SENIOR como default deliberado: elige el modelo Claude
// intermedio y calibra el prompt en ese nivel. Si algún día el curso/transversal
// define su profundidad, léela en `cargarIntentoParaJob` y propágala aquí.
const PROFUNDIDAD_POR_DEFECTO = "SEMI_SENIOR" as const
// Namespace estable UUID v5 para derivar la Idempotency-Key del par
// `(intentoId, capa)`. Cualquier UUID v4 constante sirve; este no rota.
const IDEMPOTENCY_NAMESPACE = "3e7a4f1e-cb52-4b1e-9c5f-7f0b8e2d4a01"

@Injectable()
export class JobEvaluacionTransversalService {
  private readonly logger = new Logger(JobEvaluacionTransversalService.name)
  private readonly enCurso = new Set<string>()
  private readonly pendientes: string[] = []

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly capas: TransversalCapasService,
    private readonly repoFetch: RepoFetchService,
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
      const evaluado = await this.cargarCapaCualitativaSeguro(
        intentoId,
        intento.repoUrl,
        sesionInterna,
      )
      const duracion = Date.now() - inicio
      if (evaluado) {
        this.logger.log(
          `Intento ${intentoId} evaluado en ${duracion}ms (provider=${this.ai.providerName}).`,
        )
      } else {
        this.logger.warn(
          `Intento ${intentoId} NO evaluado (capa cualitativa falló) en ${duracion}ms.`,
        )
      }
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
  } | null> {
    const intento = await this.prisma.intentoTransversal.findUnique({
      where: { id: intentoId },
      select: {
        repoUrl: true,
        estado: true,
        colaboradorId: true,
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
    }
  }

  /** Devuelve `true` si la capa se cargó; `false` si la descarga o la IA fallaron. */
  private async cargarCapaCualitativaSeguro(
    intentoId: string,
    repoUrl: string,
    sesion: SesionUsuario,
  ): Promise<boolean> {
    try {
      const repo = await this.repoFetch.descargarYEmpaquetar(repoUrl)
      const cualitativa = await this.ai.evaluarRepoCualitativo({
        contenidoRepo: repo.contenido,
        profundidad: PROFUNDIDAD_POR_DEFECTO,
      })
      await this.capas.cargarCapaCualitativa({
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
      return true
    } catch (error) {
      this.logCapaFallo("cualitativa", intentoId, error)
      return false
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
   * Sesion sintetica del worker — el `usuarioId` apunta al colaborador para que
   * las idempotency keys queden trazables por intento. El service de carga no
   * usa `usuario.rol` para autorizar (los guards del controller lo resuelven).
   */
  private sesionWorker(colaboradorId: string): SesionUsuario {
    return { usuarioId: colaboradorId, rol: RolUsuario.ADMIN }
  }

  /**
   * Deriva una `Idempotency-Key` UUID-shape determinista del par `(intentoId,
   * capa)` con SHA-1 + namespace fijo (algoritmo símil UUID v5). Produce el
   * shape `xxxxxxxx-xxxx-5xxx-Nxxx-xxxxxxxxxxxx` con `N in [89ab]`.
   */
  private derivarKey(intentoId: string, capa: "cualitativa"): string {
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
