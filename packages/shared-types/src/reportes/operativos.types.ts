import type { TipoAlerta } from "./alertas"

/**
 * Tipos de respuesta de los 4 endpoints operativos del Slice 11 P11b.
 *
 * Convencion: todos los tipos son `readonly` recursivos para evitar
 * mutaciones accidentales en el frontend. Las fechas se exponen como
 * ISO 8601 (`string`) en HTTP — los tipos `Date` viven solo en el backend
 * (cumple regla shared-types §3: sin dependencia de runtime).
 */

export interface ColaboradorEmbed {
  readonly id: string
  readonly nombre: string
  readonly email: string
}

// ---------------------------------------------------------------------------
// E1 — avance-curso
// ---------------------------------------------------------------------------

export interface FilaAvanceCurso {
  readonly asignacionId: string
  readonly colaborador: ColaboradorEmbed
  readonly estado: string
  readonly porcentajeAvance: number
  readonly alertas: readonly TipoAlerta[]
}

/** Evento del listado historico de un curso (D-S11-B9). */
export interface EventoHistorico {
  readonly tipoCambio: string
  readonly fecha: string
  readonly autor: string | null
  readonly valorPrev: string | null
  readonly valorNuevo: string | null
  readonly motivo: string | null
}

// ---------------------------------------------------------------------------
// E2 — detalle-colaborador
// ---------------------------------------------------------------------------

export interface ItemPlanReporte {
  readonly id: string
  readonly moduloId: string
  readonly seccionId: string
  readonly caracter: string
  readonly razon: string
}

export interface FichaRelevanteItem {
  readonly skillId: string
  readonly etiqueta: string
  readonly notaActual: number | null
  readonly origen: string | null
}

export interface IntentoBloqueResumen {
  readonly id: string
  readonly bloqueId: string
  readonly fechaInicio: string
  readonly fechaFin: string | null
  readonly mejorPorcentaje: number | null
  readonly estaInvalidado: boolean
}

export interface IntentoTransversalResumen {
  readonly id: string
  readonly estado: string
  readonly fechaInicio: string
  readonly fechaFinalizacion: string | null
  readonly capasCargadas: number
}

export interface IntentoEntrevistaIaResumen {
  readonly id: string
  readonly estado: string
  readonly fechaInicio: string
  readonly fechaFinalizacion: string | null
  readonly notaGlobal: number | null
  readonly notaAjustadaAdmin: number | null
}

export interface DetalleColaboradorAsignacion {
  readonly id: string
  readonly estado: string
  readonly rolAsignacion: string
  readonly fechaInscripcion: string | null
  readonly fechaCierre: string | null
}

export interface UltimosIntentos {
  readonly bloque: readonly IntentoBloqueResumen[]
  readonly transversal: readonly IntentoTransversalResumen[]
  readonly entrevistaIa: readonly IntentoEntrevistaIaResumen[]
}

export interface HayMasIntentos {
  readonly bloque: boolean
  readonly transversal: boolean
  readonly entrevistaIa: boolean
}

export interface DetalleColaboradorResponse {
  readonly asignacion: DetalleColaboradorAsignacion
  readonly plan: readonly ItemPlanReporte[]
  readonly fichaRelevante: readonly FichaRelevanteItem[]
  readonly ultimosIntentos: UltimosIntentos
  readonly hayMas: HayMasIntentos
  readonly meta: { readonly frescura: string }
}

// ---------------------------------------------------------------------------
// E3 — brechas-detectadas
// ---------------------------------------------------------------------------

export interface UmbralesBrechas {
  /**
   * Promedio de `CursoSkillExigida.notaMinima` cuando el curso tiene skills
   * exigidas (umbral "cumple" por skill). Si no hay skills, `null`.
   */
  readonly umbralCumple: number | null
  readonly umbralNoCumple: number
  /** Mapea a `Curso.umbralesLogro.solido` (default 70 si ausente). */
  readonly umbralAprobado: number
  /** Mapea a `Curso.umbralesLogro.excelencia` (default 85 si ausente). */
  readonly umbralExcelencia: number
}

export interface SkillBrechaItem {
  readonly skillId: string
  readonly etiqueta: string
  readonly noCumple: number
  readonly cerca: number
  readonly cumple: number
}

export interface BrechasDetectadasResponse {
  readonly cursoId: string
  readonly umbrales: UmbralesBrechas
  readonly skills: readonly SkillBrechaItem[]
  readonly meta: { readonly frescura: string }
}

// ---------------------------------------------------------------------------
// E4 — centro-revision
// ---------------------------------------------------------------------------

export type MotivoRevisionTransversal =
  | "CAPA_PENDIENTE_TESTS"
  | "CAPA_PENDIENTE_CUALITATIVA"
  | "CAPA_PENDIENTE_COMPRENSION"

export type MotivoRevisionEntrevistaIa = "AJUSTE_ADMIN_PENDIENTE"

export interface FilaCentroRevisionTransversal {
  readonly intentoId: string
  readonly colaborador: ColaboradorEmbed
  readonly cursoId: string
  readonly motivoRevision: MotivoRevisionTransversal
  readonly fechaFinalizacion: string | null
}

export interface FilaCentroRevisionEntrevistaIa {
  readonly intentoId: string
  readonly colaborador: ColaboradorEmbed
  readonly cursoId: string
  readonly motivoRevision: MotivoRevisionEntrevistaIa
  readonly fechaFinalizacion: string | null
}

export interface CentroRevisionResponse {
  readonly transversales: readonly FilaCentroRevisionTransversal[]
  readonly entrevistasIa: readonly FilaCentroRevisionEntrevistaIa[]
  readonly totales: { readonly transversales: number; readonly entrevistasIa: number }
  readonly meta: { readonly frescura: string }
}
