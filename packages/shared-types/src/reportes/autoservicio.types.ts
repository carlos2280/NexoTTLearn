/**
 * Tipos response de endpoints autoservicio bajo `/me/...` (Slice 11 P11c).
 *
 * Visibilidad cap. 10.7: pre-cierre el participante NO ve `notaGlobalFinal`
 * ni `etiquetaCualitativaFinal`. Esos campos solo aparecen cuando el curso
 * esta en estado CERRADO (flag `estaCerrado=true`).
 */

export type EtiquetaCualitativa = "excelencia" | "solido" | "enDesarrollo" | "noCumple"

export type ClaseColorSkill = "verde" | "amarillo" | "rojo"

export interface MeAvancePorSkill {
  readonly skillId: string
  readonly etiqueta: string
  readonly notaActual: number | null
  readonly claseColor: ClaseColorSkill
}

export interface MeAvanceSiguienteSeccion {
  readonly seccionId: string
  readonly moduloId: string
  readonly titulo: string
}

export interface MeAvanceCursoResponse {
  readonly cursoId: string
  readonly estaCerrado: boolean
  readonly porcentajeAvance: number
  readonly seccionesCompletadas: number
  readonly seccionesObligatorias: number
  readonly porSkill: readonly MeAvancePorSkill[]
  readonly siguienteSeccion: MeAvanceSiguienteSeccion | null
  readonly notaGlobalFinal?: number
  readonly etiquetaCualitativaFinal?: EtiquetaCualitativa
}
