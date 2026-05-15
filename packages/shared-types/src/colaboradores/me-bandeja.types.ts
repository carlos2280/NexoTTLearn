import type {
  EstadoAsignado,
  EstadoVoluntario,
  RolAsignacion,
} from "../asignaciones/asignacion.types"
import type { NotificacionResumen } from "../notificaciones/notificacion.types"

/**
 * `GET /api/v1/me/bandeja` (D-BANDEJA-1) — payload unificado de la home del
 * participante. Reemplaza la composicion de 3 queries del cliente y mueve la
 * heuristica de "siguienteAccion" al servidor.
 *
 * Doc 02_mi_bandeja §4.2 — 8 casos de siguienteAccion priorizados por el
 * server. Si ningun caso aplica devuelve `null` (empty state inicial).
 */

/**
 * Tono del deadline calculado por el servidor (unifica criterios cliente/server).
 *  - `vencido`  : `diasRestantes < 0`
 *  - `cercano`  : `0 <= diasRestantes <= 7`
 *  - `lejos`    : `diasRestantes > 7`
 *
 * Para voluntarios sin deadline efectivo se asume `lejos` (UI muestra "ritmo libre").
 */
export type TonoDeadline = "lejos" | "cercano" | "vencido"

/**
 * Fila de "Pendientes en tus cursos" ya enriquecida por el server (tono y dias
 * restantes precomputados, evita logica duplicada en cliente).
 */
export interface BandejaCursoPendiente {
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly rol: RolAsignacion
  readonly estadoAsignado: EstadoAsignado | null
  readonly estadoVoluntario: EstadoVoluntario | null
  readonly fechaDeadline: string
  readonly diasRestantes: number
  readonly tonoDeadline: TonoDeadline
  readonly porcentajeAvance: number
}

// ---- siguienteAccion: discriminated union por `tipo` -----------------------

export interface SiguienteAccionCasoReabierto {
  readonly tipo: "CASO_REABIERTO"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly fechaReapertura: string
  readonly motivo: string | null
}

export type ResultadoCierreVisible = "APTO" | "NO_APTO" | "COMPLETADO"

export interface SiguienteAccionResultadoCierre {
  readonly tipo: "RESULTADO_CIERRE_LISTO"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly resultado: ResultadoCierreVisible
  readonly fechaCierre: string
}

export interface SiguienteAccionEntrevistaIaDisponible {
  readonly tipo: "ENTREVISTA_IA_DISPONIBLE"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
}

export interface SiguienteAccionTransversalDisponible {
  readonly tipo: "TRANSVERSAL_DISPONIBLE"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
}

export interface SiguienteAccionDeadlineCritico {
  readonly tipo: "DEADLINE_CRITICO"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly fechaDeadline: string
  readonly diasRestantes: number
  readonly porcentajeAvance: number
}

export interface SiguienteAccionAsignacionNueva {
  readonly tipo: "ASIGNACION_NUEVA"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly fechaAsignacion: string
}

export interface SiguienteAccionContinuarCurso {
  readonly tipo: "CONTINUAR_CURSO"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly porcentajeAvance: number
  readonly siguienteSeccionTitulo: string | null
}

export interface SiguienteAccionExplorarVoluntariado {
  readonly tipo: "EXPLORAR_VOLUNTARIADO"
  readonly totalCursosAbiertos: number
}

export type SiguienteAccion =
  | SiguienteAccionCasoReabierto
  | SiguienteAccionResultadoCierre
  | SiguienteAccionEntrevistaIaDisponible
  | SiguienteAccionTransversalDisponible
  | SiguienteAccionDeadlineCritico
  | SiguienteAccionAsignacionNueva
  | SiguienteAccionContinuarCurso
  | SiguienteAccionExplorarVoluntariado

export type TipoSiguienteAccion = SiguienteAccion["tipo"]

// ---- contadores y envelope --------------------------------------------------

export interface MeBandejaContadores {
  readonly notificacionesNoLeidas: number
  readonly cursosVoluntariadoAbiertos: number
  readonly cursosActivos: number
}

export interface MeBandejaResponse {
  readonly siguienteAccion: SiguienteAccion | null
  readonly pendientes: readonly BandejaCursoPendiente[]
  readonly novedades: readonly NotificacionResumen[]
  readonly contadores: MeBandejaContadores
}

// ---- umbrales canonicos (server y cliente comparten) -----------------------

/**
 * Umbral del tono "cercano" para deadlines. < 0 dispara `vencido`,
 * 0..UMBRAL_DEADLINE_CERCANO_DIAS dispara `cercano`, resto `lejos`.
 */
export const UMBRAL_DEADLINE_CERCANO_DIAS = 7

/**
 * Para `DEADLINE_CRITICO` se exige ademas que el avance sea < este umbral.
 * Un participante con 90% y deadline a 5 dias no se marca como critico.
 */
export const UMBRAL_DEADLINE_CRITICO_AVANCE = 80

/**
 * Ventana para considerar una asignacion "nueva". Pasada esta ventana, si el
 * participante aun no inicia, cae a `CONTINUAR_CURSO` por defecto.
 */
export const UMBRAL_ASIGNACION_NUEVA_HORAS = 48

/**
 * Ventana para mostrar `RESULTADO_CIERRE_LISTO` y `CASO_REABIERTO` en la
 * bandeja despues del evento. Pasada la ventana, el participante ya lo vio.
 */
export const UMBRAL_VENTANA_AVISOS_DIAS = 7

/**
 * Top de items que devuelve el endpoint en `pendientes` y `novedades`.
 */
export const BANDEJA_TOP_PENDIENTES = 5
export const BANDEJA_TOP_NOVEDADES = 5
