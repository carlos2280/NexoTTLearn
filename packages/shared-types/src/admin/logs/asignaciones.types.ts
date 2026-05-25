/**
 * Slice futuro B foundation — Visor admin de `historico_estados_asignacion`.
 *
 * Tipos compartidos entre `api` y `web`. `estadoAnterior` / `estadoNuevo`
 * se modelan como `string`: en BD son TEXT libres (combinan `EstadoAsignado`,
 * `EstadoVoluntario` y transiciones operativas), por lo que un enum literal
 * cerraria el contrato incorrectamente.
 */

/**
 * Fila proyectada de `historico_estados_asignacion` para el visor admin.
 *
 * LEFT join con `Usuario` -> `Colaborador` para `autorEmail` / `autorNombre`
 * (mismo patron heredado del visor de auditoria — D-S12-A3).
 */
export interface HistoricoEstadoAsignacionResumen {
  readonly id: string
  readonly asignacionId: string
  readonly fecha: string
  readonly autorUsuarioId: string
  readonly autorEmail: string | null
  readonly autorNombre: string | null
  readonly estadoAnterior: string
  readonly estadoNuevo: string
  readonly motivo: string | null
  readonly logCambioCursoId: string | null
}
