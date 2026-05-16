/**
 * Tipos de respuesta de `GET .../evaluacion-inicial/historial` (Slice 5 P5c).
 * El contrato HTTP completo vive en
 * `docs/NexoTTLearn/05_api/endpoints/evaluacion-inicial.md`.
 *
 * Decision documentada: NO se incluye `archivoUrl` firmado en P5c — el archivo
 * original se referencia solo por `archivoId` opaco. La descarga queda diferida
 * a post-MVP.
 */

export interface CargaEvaluacionInicialResumen {
  readonly cargaId: string
  readonly previewId: string
  readonly archivoId: string
  readonly nombreOriginal: string | null
  readonly aplicadoEn: string
  readonly aplicadoPor: {
    readonly usuarioId: string
    readonly nombre: string
  }
  readonly skillsActualizadas: number
  readonly colaboradoresActualizados: number
}
