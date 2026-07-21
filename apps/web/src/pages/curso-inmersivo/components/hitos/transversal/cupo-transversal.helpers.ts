import type { CupoIntentosTransversal } from "@nexott-learn/shared-types"

/**
 * Helpers puros del cupo de intentos del hito transversal (B1). Se derivan del
 * `CupoIntentosTransversal` que calcula el backend (usados / cupo efectivo,
 * anulados ya excluidos). El front NO recalcula el cupo: solo lo presenta.
 */

/** Intentos que le quedan al participante (nunca negativo). */
export function intentosRestantes(cupo: CupoIntentosTransversal): number {
  return Math.max(0, cupo.intentosCupo - cupo.intentosUsados)
}

/** `true` si todavía puede enviar otro intento. */
export function hayIntentosDisponibles(cupo: CupoIntentosTransversal): boolean {
  return intentosRestantes(cupo) > 0
}

/**
 * Copy "Te quedan N de M intentos" (decisión de copy de Carlos, B1). El verbo
 * concuerda con los restantes (1 → "queda"); el sustantivo va siempre en plural
 * porque se refiere al total ("de M intentos"). Solo se muestra cuando quedan
 * intentos; al agotarse se pinta el aviso "sin intentos" en su lugar.
 */
export function copyIntentosRestantes(cupo: CupoIntentosTransversal): string {
  const restantes = intentosRestantes(cupo)
  const verbo = restantes === 1 ? "queda" : "quedan"
  return `Te ${verbo} ${restantes} de ${cupo.intentosCupo} intentos`
}
