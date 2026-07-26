/**
 * Tipos internos del modulo plan-personal (Slice 7 P7a).
 *
 * Los tipos de respuesta publica viven en `@nexott-learn/shared-types`
 * (`PlanResponseAdmin`, `PlanResponseParticipante`, etc.). Estos son los
 * tipos auxiliares del motor de calculo y del mapper.
 */
import type { MeAvanceSeccionEstado } from "@nexott-learn/shared-types"
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

/**
 * Resultado de evaluacion de una unica seccion frente a sus bloques.
 *
 * Es un ALIAS del tipo publico, no una copia estructural: `MeAvanceService`
 * entrega estas filas tal cual en `MeAvanceCursoResponse.seccionesEstado`, y
 * TypeScript no aplica excess-property check al asignar variables. Si fueran
 * dos interfaces gemelas, agregar aqui un campo interno (ids de bloque, notas,
 * umbrales) lo filtraria al cliente sin ningun error de compilacion. Ligados,
 * ampliar uno obliga a decidir explicitamente sobre el contrato publico.
 */
export type AvanceSeccion = MeAvanceSeccionEstado

/**
 * Salida de `PlanPersonalService.obtenerAvanceDetallado`: el agregado y el
 * desglose por seccion salen del MISMO calculo, de modo que un consumidor no
 * pueda pintar un detalle que contradiga al porcentaje.
 *
 * `secciones` cubre las que definen el avance segun el rol (obligatorias del
 * plan si es ASIGNADO, catalogo completo del curso si es VOLUNTARIO).
 */
export interface AvanceDetallado {
  readonly porcentaje: number
  readonly seccionesCompletadas: number
  readonly seccionesTotales: number
  readonly secciones: readonly AvanceSeccion[]
}

/** Item del plan tras la clasificacion del motor (pre-persistencia). */
export interface ItemPlanCalculado {
  readonly moduloId: string
  readonly seccionId: string
  readonly caracter: "OBLIGATORIA" | "OPCIONAL"
  readonly razon: "SKILL_FALTANTE" | "SKILL_CERCA" | "SKILL_YA_CUMPLE" | "AJUSTE_ADMIN"
}
