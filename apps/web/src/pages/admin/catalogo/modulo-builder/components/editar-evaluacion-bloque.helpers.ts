import { esTipoBloqueEvaluable } from "@nexott-learn/shared-types"

export interface CasillaEvaluable {
  readonly visible: boolean
  readonly puedeMarcar: boolean
}

/**
 * Decide si el panel de propiedades ofrece la casilla "Bloque evaluable".
 * Solo los tipos que reciben intentos (QUIZ, CODIGO_PREGUNTAS, SQL_EJERCICIO)
 * pueden marcarse; en los demas la casilla no aparece, salvo que el bloque ya
 * este marcado (dato heredado): entonces se muestra solo para desmarcarlo.
 */
export function casillaEvaluable(tipo: string, esEvaluableActual: boolean): CasillaEvaluable {
  const puedeMarcar = esTipoBloqueEvaluable(tipo)
  return { visible: puedeMarcar || esEvaluableActual, puedeMarcar }
}
