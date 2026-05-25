import { RolAsignacion } from "@prisma/client"

/**
 * Helper puro `calcularResultadoFinal` (D-S11-A6) — decide el estado final
 * de una asignacion al cerrar el curso, segun la decision del admin y las
 * notas vigentes de las skills exigidas (D44).
 *
 * Pura: sin Prisma, sin Logger, sin side effects. Testeable por matriz
 * exhaustiva en `calcular-resultado-final.spec.ts`.
 *
 * Reglas D44 / D58 aplicadas:
 *  - `RETIRAR`               -> `RETIRADO`.
 *  - `MANTENER_PENDIENTE`    -> `null` (la asignacion no transiciona, sigue
 *                              en EN_PROGRESO).
 *  - `CERRAR_APTO` voluntario / `CERRAR_NO_APTO` voluntario -> `COMPLETADO`
 *                              (D58: voluntarios no se evaluan APTO/NO_APTO).
 *  - `CERRAR_APTO` asignado  -> `APTO` si TODAS las skills OBLIGATORIA tienen
 *                              `notaActual >= umbralCumple`. Si alguna no lo
 *                              cumple, se rebaja a `NO_APTO`.
 *  - `CERRAR_NO_APTO` asignado -> `NO_APTO` directo.
 *
 * El umbral de comparacion (D44 -> `Curso.umbralesLogro.cumple`) lo pasa el
 * caller por skill — el helper no conoce el modelo Prisma del curso.
 */

export type AccionCierre = "CERRAR_APTO" | "CERRAR_NO_APTO" | "RETIRAR" | "MANTENER_PENDIENTE"

export type ResultadoFinal = "APTO" | "NO_APTO" | "COMPLETADO" | "RETIRADO"

export type CaracterSkill = "OBLIGATORIA" | "OPCIONAL"

export interface NotaSkillSnapshot {
  readonly skillId: string
  readonly caracter: CaracterSkill
  readonly notaActual: number | null
  readonly umbralCumple: number
}

export interface CalcularResultadoInput {
  readonly rol: RolAsignacion
  readonly accion: AccionCierre
  readonly notasSkills: readonly NotaSkillSnapshot[]
}

export function calcularResultadoFinal(input: CalcularResultadoInput): ResultadoFinal | null {
  if (input.accion === "MANTENER_PENDIENTE") {
    return null
  }
  if (input.accion === "RETIRAR") {
    return "RETIRADO"
  }
  if (input.rol === RolAsignacion.VOLUNTARIO) {
    return "COMPLETADO"
  }
  if (input.accion === "CERRAR_NO_APTO") {
    return "NO_APTO"
  }
  return cumpleTodasLasObligatorias(input.notasSkills) ? "APTO" : "NO_APTO"
}

function cumpleTodasLasObligatorias(notas: readonly NotaSkillSnapshot[]): boolean {
  const obligatorias = notas.filter((n) => n.caracter === "OBLIGATORIA")
  if (obligatorias.length === 0) {
    return true
  }
  return obligatorias.every((n) => n.notaActual !== null && n.notaActual >= n.umbralCumple)
}
