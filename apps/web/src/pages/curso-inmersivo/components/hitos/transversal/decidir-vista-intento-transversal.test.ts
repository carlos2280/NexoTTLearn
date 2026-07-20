import { describe, expect, it } from "vitest"
import { decidirVistaIntentoTransversal } from "./decidir-vista-intento-transversal"

describe("decidirVistaIntentoTransversal", () => {
  it("EN_EVALUACION → evaluando", () => {
    expect(decidirVistaIntentoTransversal({ estado: "EN_EVALUACION", aprobado: null })).toBe(
      "evaluando",
    )
  })

  it("EVALUADO → en-revision (no 'aun-no' aunque aprobado sea null)", () => {
    // Regresión del bug del "Casi" falso: en EVALUADO, aprobado es null hasta
    // FINALIZADO; antes caía en "aun-no" y mostraba "Casi" + botón de reenviar.
    expect(decidirVistaIntentoTransversal({ estado: "EVALUADO", aprobado: null })).toBe(
      "en-revision",
    )
  })

  it("FINALIZADO + aprobado → aprobado", () => {
    expect(decidirVistaIntentoTransversal({ estado: "FINALIZADO", aprobado: true })).toBe(
      "aprobado",
    )
  })

  it("FINALIZADO + no aprobado → aun-no", () => {
    expect(decidirVistaIntentoTransversal({ estado: "FINALIZADO", aprobado: false })).toBe("aun-no")
  })

  it("ANULADO → aun-no (permite reenviar)", () => {
    expect(decidirVistaIntentoTransversal({ estado: "ANULADO", aprobado: null })).toBe("aun-no")
  })

  it("FALLO_ACCESO_REPO → repo-inaccesible (B2c: no queda colgado en 'evaluando')", () => {
    expect(decidirVistaIntentoTransversal({ estado: "FALLO_ACCESO_REPO", aprobado: null })).toBe(
      "repo-inaccesible",
    )
  })
})
