/**
 * Catalogo cerrado de alertas operativas (D-S11-B2). Se computa en
 * `reportes.service.ts` por cada `FilaAvanceCurso` segun reglas:
 *  - SIN_ACTIVIDAD_7_DIAS         : ultimo intento del colaborador > 7d (o sin intentos).
 *  - PLAN_NO_CALCULADO            : asignacion ASIGNADO sin `PlanEstudio` asociado.
 *  - PLAN_DESACTUALIZADO          : `PlanEstudio.estaDesactualizado=true`.
 *  - INTENTO_INVALIDADO_RECIENTE  : `IntentoBloque.estaInvalidado=true` en ultimos 30 dias.
 *
 * El enum se mantiene readonly + as const para preservar la inferencia de tipos
 * y evitar `const enum` (incompatible con `isolatedModules` del frontend).
 */
export const TIPOS_ALERTA = [
  "SIN_ACTIVIDAD_7_DIAS",
  "PLAN_NO_CALCULADO",
  "PLAN_DESACTUALIZADO",
  "INTENTO_INVALIDADO_RECIENTE",
] as const

export type TipoAlerta = (typeof TIPOS_ALERTA)[number]

const TIPOS_ALERTA_SET: ReadonlySet<string> = new Set(TIPOS_ALERTA)

export function esTipoAlerta(value: unknown): value is TipoAlerta {
  return typeof value === "string" && TIPOS_ALERTA_SET.has(value)
}
