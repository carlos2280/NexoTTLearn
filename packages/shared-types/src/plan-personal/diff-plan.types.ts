/**
 * Respuesta de `GET /api/v1/asignaciones/:asignacionId/plan/diff` (Slice 7 P7c).
 *
 * El diff compara la `fichaSnapshot` persistida al momento del calculo con la
 * ficha vigente del colaborador. Solo aparecen skills cuyo estado o nota
 * cambio. Lectura admin-only (D-S7-D1) — el participante recibe 404.
 *
 * El diff es READ-ONLY: NO marca el plan como desactualizado, NO recalcula.
 */
import type { EstadoBrechaSnapshot } from "./ficha-snapshot.schema"

export type ImpactoDiffSkill =
  | "SECCION_DEJA_DE_SER_OBLIGATORIA"
  | "SECCION_PASA_A_OBLIGATORIA"
  | "CAMBIO_NOTA_SIN_IMPACTO"

export type ImpactoSeccionDiff = "DEJA_DE_SER_OBLIGATORIA" | "PASA_A_OBLIGATORIA"

export interface DiffSeccionAfectada {
  readonly seccionId: string
  readonly tituloSeccion: string
  readonly impactoSeccion: ImpactoSeccionDiff
}

export interface DiffSkillItem {
  readonly skillId: string
  readonly notaSnapshot: number | null
  readonly notaVigente: number | null
  readonly estadoSnapshot: EstadoBrechaSnapshot
  readonly estadoVigente: EstadoBrechaSnapshot
  readonly impacto: ImpactoDiffSkill
  readonly seccionesAfectadas: readonly DiffSeccionAfectada[]
}

export interface PlanDiffResponse {
  readonly planId: string
  readonly asignacionId: string
  readonly fechaCalculoSnapshot: string
  readonly estaDesactualizado: boolean
  readonly diff: readonly DiffSkillItem[]
}
