/**
 * Slice futuro B foundation — Visor admin de `log_cambios_curso`.
 *
 * Tipos compartidos entre `api` y `web` para el visor de logs de cambios de
 * curso. Las acciones literales se mantienen en sincronia manual con el enum
 * Prisma `accion_log_curso_enum` (mismo trade-off heredado por la convencion
 * shared-types §3: sin import de @prisma/client).
 */

export const ACCIONES_LOG_CURSO = [
  "CAMBIO_AREAS",
  "CAMBIO_PESOS",
  "CAMBIO_OBJETIVOS",
  "TOGGLE_TRANSVERSAL",
  "TOGGLE_ENTREVISTA",
  "CAMBIO_MODULOS",
  "PUBLICACION",
  "CIERRE",
  "DESHACER_CIERRE",
  "ARCHIVADO",
  "OTRO",
] as const

export type AccionLogCursoLiteral = (typeof ACCIONES_LOG_CURSO)[number]

/**
 * Fila proyectada de `log_cambios_curso` para el visor admin.
 *
 * LEFT join con `Usuario` -> `Colaborador` para `autorEmail` / `autorNombre`.
 * Si el colaborador asociado al usuario fue dado de baja sin cascada, los
 * campos derivados quedan en null sin romper la respuesta.
 *
 * `previewImpacto` se expone como JSON arbitrario (estructura libre acumulada
 * por los flujos de cambio): el frontend renderiza segun el tipo de accion.
 */
export interface LogCambioCursoResumen {
  readonly id: string
  readonly cursoId: string
  readonly cursoTitulo: string | null
  readonly fecha: string
  readonly autorUsuarioId: string
  readonly autorEmail: string | null
  readonly autorNombre: string | null
  readonly accion: AccionLogCursoLiteral
  readonly motivo: string
  readonly previewImpacto: Record<string, unknown> | null
}
