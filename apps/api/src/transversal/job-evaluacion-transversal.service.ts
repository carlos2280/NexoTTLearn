import { createHash } from "node:crypto"
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import { RolUsuario } from "@prisma/client"
import { AiService } from "../common/ai/ai.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { RepoFetchService } from "../common/repo-fetch/repo-fetch.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { TransversalCapasService } from "./transversal-capas.service"
import { parsearCriteriosEvaluacion } from "./transversal.helpers"

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
 *  - `onModuleInit` reencola al arranque los intentos `EN_EVALUACION` con repo:
 *    la cola vive en memoria, así que un reinicio/deploy la perdería y el intento
 *    quedaría colgado. El barrido los rescata vía `dispatch` (NO SQL crudo) para
 *    que la finalización siga replicando a skills (D33) y disparando notificaciones.
 */
const JOB_DELAY_MS = 2000
const CONCURRENCIA_MAX = 10
// Tope de intentos a reencolar en un solo arranque. Los transversales son escasos
// (decenas, no miles); 100 deja margen holgado sobre el uso real. Si alguna vez se
// superara, el barrido loguea cuántos quedaron y el resto se recoge al próximo boot.
const MAX_REDISPATCH_BOOT = 100
// El transversal no tiene un campo de profundidad propio, así que la evaluación
// cualitativa usa SEMI_SENIOR como default deliberado: elige el modelo Claude
// intermedio y calibra el prompt en ese nivel. Si algún día el curso/transversal
// define su profundidad, léela en `cargarIntentoParaJob` y propágala aquí.
const PROFUNDIDAD_POR_DEFECTO = "SEMI_SENIOR" as const
// Namespace estable UUID v5 para derivar la Idempotency-Key del par
// `(intentoId, capa)`. Cualquier UUID v4 constante sirve; este no rota.
const IDEMPOTENCY_NAMESPACE = "3e7a4f1e-cb52-4b1e-9c5f-7f0b8e2d4a01"

interface IntentoParaJob {
  readonly repoUrl: string
  readonly usuarioId: string
  readonly dimensiones: readonly string[]
  readonly criterios: readonly string[]
  readonly umbral: number
}

@Injectable()
export class JobEvaluacionTransversalService implements OnModuleInit {
  private readonly logger = new Logger(JobEvaluacionTransversalService.name)
  private readonly enCurso = new Set<string>()
  private readonly pendientes: string[] = []

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly capas: TransversalCapasService,
    private readonly repoFetch: RepoFetchService,
  ) {}

  /**
   * Rescata al arranque los intentos que quedaron `EN_EVALUACION` con repo: un
   * reinicio/deploy borra la cola en memoria y los dejaría colgados. Se reencolan
   * los más viejos primero, con tope `MAX_REDISPATCH_BOOT`. Toda la operación va
   * en `try/catch`: un fallo de BD no debe tumbar el bootstrap de la app.
   *
   * Asunción **single-instance**: el dedupe de la cola (`enCurso`/`pendientes`) es
   * per-proceso. Con varios pods, cada uno reencolaría los mismos intentos; la
   * escritura final está protegida por la Idempotency-Key, pero `descargarYEmpaquetar`
   * y la IA correrían N veces (coste duplicado). Si se escala horizontal, añadir un
   * lock (p. ej. `FOR UPDATE SKIP LOCKED` o un estado intermedio `ENCOLADO`).
   */
  async onModuleInit(): Promise<void> {
    try {
      // take + 1 para distinguir "justo el tope" de "hay más" sin un count extra.
      const colgados = await this.prisma.intentoTransversal.findMany({
        where: { estado: "EN_EVALUACION", anulado: false, repoUrl: { not: null } },
        select: { id: true },
        orderBy: { fecha: "asc" },
        take: MAX_REDISPATCH_BOOT + 1,
      })
      if (colgados.length === 0) {
        return
      }
      const hayMas = colgados.length > MAX_REDISPATCH_BOOT
      const aReencolar = hayMas ? colgados.slice(0, MAX_REDISPATCH_BOOT) : colgados
      for (const { id } of aReencolar) {
        this.dispatch(id)
      }
      if (hayMas) {
        this.logger.warn(
          `Reencolados ${aReencolar.length} intentos EN_EVALUACION (tope alcanzado); hay más pendientes que se recogerán en el próximo arranque.`,
        )
      } else {
        this.logger.log(`Reencolados ${aReencolar.length} intentos EN_EVALUACION al arranque.`)
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      this.logger.error(`Fallo el barrido de reencolado al arranque: ${detalle}`)
    }
  }

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
      const sesionInterna = this.sesionWorker(intento.usuarioId)
      const evaluado = await this.cargarCapaCualitativaSeguro(intentoId, intento, sesionInterna)
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

  private async cargarIntentoParaJob(intentoId: string): Promise<IntentoParaJob | null> {
    const intento = await this.prisma.intentoTransversal.findUnique({
      where: { id: intentoId },
      select: {
        repoUrl: true,
        estado: true,
        // La sesión sintética del worker escribe la Idempotency-Key, cuya FK
        // apunta a `Usuario.id` (NO a `Colaborador.id`). Traemos el usuario real
        // del colaborador para no violar la FK al persistir la capa.
        colaborador: { select: { usuario: { select: { id: true } } } },
        // Ejes del informe = skills que el transversal declara + umbral para
        // derivar el veredicto (apto / necesita_ajustes) sin preguntárselo a la IA.
        transversal: {
          select: {
            umbralAprobacion: true,
            // Lista "a evaluar" que redactó el admin (JSONB `string[]`). Se pasa
            // al motor como criterios a verificar; el orden lo fija el admin.
            criteriosEvaluacion: true,
            // `orderBy` estable: las dimensiones del informe deben salir en el mismo
            // orden entre corridas (la comparabilidad entre repos es el objetivo).
            skills: {
              select: { skill: { select: { etiquetaVisible: true } } },
              orderBy: { skill: { etiquetaVisible: "asc" } },
            },
          },
        },
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
    const usuarioId = intento.colaborador.usuario?.id
    if (usuarioId == null) {
      // Defensivo: en la práctica siempre existe (solo un participante logueado
      // crea intentos). Si faltara, persistir la capa violaría la FK de idempotencia.
      this.logger.warn(
        `Intento ${intentoId}: el colaborador no tiene usuario asociado; se omite job.`,
      )
      return null
    }
    return {
      repoUrl: intento.repoUrl,
      usuarioId,
      dimensiones: intento.transversal.skills.map((s) => s.skill.etiquetaVisible),
      // JSONB no confiable → validar con el contrato; si es null/legacy/corrupto,
      // se trata como "sin lista" (no se evalúa checklist).
      criterios: parsearCriteriosEvaluacion(intento.transversal.criteriosEvaluacion),
      umbral: intento.transversal.umbralAprobacion.toNumber(),
    }
  }

  /** Devuelve `true` si la capa se cargó; `false` si la descarga, la IA o una nota nula lo impidieron. */
  private async cargarCapaCualitativaSeguro(
    intentoId: string,
    intento: IntentoParaJob,
    sesion: SesionUsuario,
  ): Promise<boolean> {
    try {
      const repo = await this.repoFetch.descargarYEmpaquetar(intento.repoUrl)
      const informe = await this.ai.evaluarRepoCualitativo({
        contenidoRepo: repo.contenido,
        profundidad: PROFUNDIDAD_POR_DEFECTO,
        dimensiones: intento.dimensiones,
        criterios: intento.criterios,
      })
      if (informe.nota === null) {
        // La IA no pudo puntuar el repo: no transicionamos. El admin lo revisa a mano.
        this.logger.warn(`Intento ${intentoId}: la IA no pudo evaluar el repo (nota null); skip.`)
        return false
      }
      const veredicto = informe.nota >= intento.umbral ? "apto" : "necesita_ajustes"
      await this.capas.cargarCapaCualitativa({
        intentoId,
        body: {
          nota: informe.nota,
          detalle: {
            // `comentario` se conserva por compat con la UI actual (= resumen).
            // El worker no pasa por el pipe Zod, así que aplicamos el trim del
            // contrato aquí; `resumen` ya viene acotado a 2000 por el schema.
            comentario: informe.resumen.trim(),
            confianza: confianzaAUpper(informe.confianza),
            veredicto,
            resumen: informe.resumen,
            queReviso: informe.queReviso,
            queNoReviso: informe.queNoReviso,
            porDimension: informe.porDimension.map((d) => ({ ...d })),
            fortalezas: [...informe.fortalezas],
            aReforzar: informe.aReforzar.map((r) => ({ ...r })),
            // Checklist de la "Lista a evaluar" del admin (aditivo/opcional): solo
            // se persiste si el transversal declaró criterios.
            ...(informe.cumplimientoCriterios && informe.cumplimientoCriterios.length > 0
              ? { cumplimientoCriterios: informe.cumplimientoCriterios.map((c) => ({ ...c })) }
              : {}),
          },
        },
        idempotencyKey: this.derivarKey(intentoId, "cualitativa"),
        usuario: sesion,
        // Evidencia inmutable de "qué evaluó la IA" (Fase 4b ③): sobrevive aunque
        // el participante borre o cambie el repo. `contenido` = texto exacto leído.
        evidenciaRepo: {
          commit: repo.commit,
          archivos: [...repo.archivos],
          truncado: repo.truncado,
          bytesTotales: repo.bytesTotales,
          contenido: repo.contenido,
        },
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
   * Sesion sintetica del worker — `usuarioId` es el `Usuario.id` real del
   * participante dueño del intento (resuelto en `cargarIntentoParaJob`), no el
   * `Colaborador.id`: la Idempotency-Key que escribe la capa tiene FK a
   * `Usuario.id`. El service de carga no usa `usuario.rol` para autorizar (los
   * guards del controller lo resuelven).
   */
  private sesionWorker(usuarioId: string): SesionUsuario {
    return { usuarioId, rol: RolUsuario.ADMIN }
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
