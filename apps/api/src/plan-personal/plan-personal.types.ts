/**
 * Tipos internos del modulo plan-personal (Slice 7 P7a).
 *
 * Los tipos de respuesta publica viven en `@nexott-learn/shared-types`
 * (`PlanResponseAdmin`, `PlanResponseParticipante`, etc.). Estos son los
 * tipos auxiliares del motor de calculo y del mapper.
 */
import type { Prisma } from "@prisma/client"

export const SELECT_PLAN_FIELDS = {
  id: true,
  asignacionId: true,
  fechaCalculo: true,
  fichaSnapshot: true,
  estaDesactualizado: true,
} as const satisfies Prisma.PlanEstudioSelect

export const SELECT_PLAN_ITEM_FIELDS = {
  id: true,
  planId: true,
  moduloId: true,
  seccionId: true,
  caracter: true,
  razon: true,
} as const satisfies Prisma.ItemPlanSelect

/** Modulo + secciones cargados para el mapper de respuesta. */
export interface ModuloSeccionRef {
  readonly moduloId: string
  readonly tituloModulo: string
  readonly seccionId: string
  readonly seccionTitulo: string
}

export interface AvancePlan {
  readonly seccionesCompletadas: number
  readonly seccionesObligatorias: number
  readonly porcentaje: number
}

/** Resultado de evaluacion de una unica seccion frente a sus bloques. */
export interface AvanceSeccion {
  readonly seccionId: string
  readonly completada: boolean
  readonly bloquesCompletados: number
  readonly bloquesTotales: number
}

/** Item del plan tras la clasificacion del motor (pre-persistencia). */
export interface ItemPlanCalculado {
  readonly moduloId: string
  readonly seccionId: string
  readonly caracter: "OBLIGATORIA" | "OPCIONAL"
  readonly razon: "SKILL_FALTANTE" | "SKILL_CERCA" | "SKILL_YA_CUMPLE" | "AJUSTE_ADMIN"
}
