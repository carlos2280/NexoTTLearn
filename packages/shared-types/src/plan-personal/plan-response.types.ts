/**
 * Tipos de respuesta del plan de estudio personal. La visibilidad esta
 * diferenciada D90 (D-S7-D2): el PARTICIPANTE NO recibe `estaDesactualizado`,
 * `fichaSnapshot` ni `razon` en los items. El mapper en el service decide
 * que forma entregar segun el rol de la sesion.
 */
import type { FichaSnapshotV1 } from "./ficha-snapshot.schema"

export type CaracterItemPlan = "OBLIGATORIA" | "OPCIONAL"
export type RazonItemPlan = "SKILL_FALTANTE" | "SKILL_CERCA" | "SKILL_YA_CUMPLE" | "AJUSTE_ADMIN"

export interface PlanAvanceBloques {
  readonly bloquesCompletados: number
  readonly bloquesTotales: number
}

interface SeccionPlanItemBase {
  readonly seccionId: string
  readonly titulo: string
  readonly caracter: CaracterItemPlan
  readonly completada: boolean
  readonly avance: PlanAvanceBloques
}

export interface SeccionPlanItemAdmin extends SeccionPlanItemBase {
  readonly razon: RazonItemPlan
}

export type SeccionPlanItemParticipante = SeccionPlanItemBase

interface ModuloPlanBase {
  readonly moduloId: string
  readonly tituloModulo: string
}

export interface ModuloPlanAdmin extends ModuloPlanBase {
  readonly secciones: readonly SeccionPlanItemAdmin[]
}

export interface ModuloPlanParticipante extends ModuloPlanBase {
  readonly secciones: readonly SeccionPlanItemParticipante[]
}

export interface PlanAvance {
  readonly seccionesCompletadas: number
  readonly seccionesObligatorias: number
  readonly porcentaje: number
}

interface PlanResponseBase {
  readonly planId: string
  readonly asignacionId: string
  readonly fechaCalculo: string
  readonly avance: PlanAvance
}

export interface PlanResponseAdmin extends PlanResponseBase {
  readonly estaDesactualizado: boolean
  readonly fichaSnapshot: FichaSnapshotV1
  readonly items: readonly ModuloPlanAdmin[]
}

export interface PlanResponseParticipante extends PlanResponseBase {
  readonly items: readonly ModuloPlanParticipante[]
}

export type PlanResponse = PlanResponseAdmin | PlanResponseParticipante
