/**
 * Slice futuro B (P-B-b) — Visor admin de `historico_estados_modulo`.
 *
 * Los literales se mantienen en sincronia manual con el enum Prisma
 * `estado_modulo_enum` (mismo trade-off heredado: shared-types no importa
 * `@prisma/client`).
 */

export const ESTADOS_LOG_MODULO = ["ACTIVO", "ARCHIVADO"] as const
export type EstadoLogModulo = (typeof ESTADOS_LOG_MODULO)[number]

export interface LogModuloEstadoResumen {
  readonly id: string
  readonly moduloId: string
  readonly fecha: string
  readonly autorUsuarioId: string
  readonly autorEmail: string | null
  readonly autorNombre: string | null
  readonly estadoAnterior: EstadoLogModulo
  readonly estadoNuevo: EstadoLogModulo
  readonly motivo: string
}
