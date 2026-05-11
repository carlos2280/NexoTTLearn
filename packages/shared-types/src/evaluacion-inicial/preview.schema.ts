/**
 * Tipos de la respuesta de `POST .../evaluacion-inicial/preview` (D-EVI-2,
 * D-EVI-6, D-EVI-8). El contrato HTTP completo vive en
 * `docs/NexoTTLearn/05_api/endpoints/evaluacion-inicial.md`.
 *
 * Solo tipos puros — sin runtime, sin Prisma, sin React (regla
 * `shared-types`).
 */

export type FuenteCambioPreview = "SKILL_DIRECTA" | "AREA_HEREDADA"

export interface PreviewResumen {
  readonly filasTotales: number
  readonly filasValidas: number
  readonly filasRechazadas: number
  readonly skillsAfectadas: number
  readonly colaboradoresAfectados: number
}

export interface PreviewCambioItem {
  readonly colaboradorId: string
  readonly email: string
  readonly nombreColaborador: string
  readonly skillId: string
  readonly etiquetaSkill: string
  readonly valorAnterior: number | null
  readonly valorNuevo: number | null
  readonly fuente: FuenteCambioPreview
}

export interface PreviewErrorCelda {
  readonly celda: string
  readonly codigo: string
  readonly mensaje: string
}

export interface PreviewRechazoItem {
  readonly fila: number
  readonly email: string | null
  readonly errores: readonly PreviewErrorCelda[]
}

export interface PreviewResponse {
  readonly previewId: string
  readonly expiraEn: string
  readonly archivoId: string
  readonly resumen: PreviewResumen
  readonly cambios: readonly PreviewCambioItem[]
  readonly rechazos: readonly PreviewRechazoItem[]
}
