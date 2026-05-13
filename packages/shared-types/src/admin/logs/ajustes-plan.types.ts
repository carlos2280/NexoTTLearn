/**
 * Slice futuro B (P-B-b) — Visor admin de `ajustes_plan`.
 *
 * Los literales se mantienen en sincronia manual con el enum Prisma
 * `accion_ajuste_plan_enum`.
 */

export const ACCIONES_AJUSTE_PLAN = ["AGREGAR", "QUITAR", "EXIMIR", "CAMBIAR_CARACTER"] as const
export type AccionAjustePlanLiteral = (typeof ACCIONES_AJUSTE_PLAN)[number]

export interface LogAjustePlanResumen {
  readonly id: string
  readonly planId: string
  readonly fecha: string
  readonly autorUsuarioId: string
  readonly autorEmail: string | null
  readonly autorNombre: string | null
  readonly accion: AccionAjustePlanLiteral
  readonly motivo: string
  readonly seccionId: string | null
}
