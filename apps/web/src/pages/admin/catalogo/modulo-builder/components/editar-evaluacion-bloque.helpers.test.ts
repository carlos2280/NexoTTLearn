import { describe, expect, it } from "vitest"
import { casillaEvaluable } from "./editar-evaluacion-bloque.helpers"

// Solo QUIZ, CODIGO_PREGUNTAS y SQL_EJERCICIO reciben intentos. En los demas
// tipos la casilla "Bloque evaluable" no se ofrece; si el bloque ya quedo
// marcado (dato heredado), se muestra solo para poder desmarcarlo.
describe("casillaEvaluable", () => {
  it("QUIZ, CODIGO_PREGUNTAS y SQL_EJERCICIO: visible y se puede marcar", () => {
    for (const tipo of ["QUIZ", "CODIGO_PREGUNTAS", "SQL_EJERCICIO"] as const) {
      expect(casillaEvaluable(tipo, false)).toEqual({ visible: true, puedeMarcar: true })
    }
  })

  it("PARRAFO o RECURSO sin marcar: no se muestra", () => {
    expect(casillaEvaluable("PARRAFO", false)).toEqual({ visible: false, puedeMarcar: false })
    expect(casillaEvaluable("RECURSO", false)).toEqual({ visible: false, puedeMarcar: false })
  })

  it("PARRAFO ya marcado evaluable: visible solo para desmarcar", () => {
    expect(casillaEvaluable("PARRAFO", true)).toEqual({ visible: true, puedeMarcar: false })
  })
})
