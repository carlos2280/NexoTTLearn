import { describe, expect, it } from "vitest"
import { etiquetaHistorialIntento } from "./etiqueta-historial-intento"

describe("etiquetaHistorialIntento", () => {
  it("EN_EVALUACION → 'En evaluación' neutro", () => {
    expect(etiquetaHistorialIntento({ estado: "EN_EVALUACION", aprobado: null })).toEqual({
      texto: "En evaluación",
      tono: "neutro",
    })
  })

  it("EVALUADO → 'En revisión' (no 'Aún no')", () => {
    expect(etiquetaHistorialIntento({ estado: "EVALUADO", aprobado: null })).toEqual({
      texto: "En revisión",
      tono: "neutro",
    })
  })

  it("ANULADO → 'Anulado' (no 'Aún no', aunque aprobado sea null)", () => {
    // Regresión: un intento que el admin anuló no es un rechazo del participante.
    expect(etiquetaHistorialIntento({ estado: "ANULADO", aprobado: null })).toEqual({
      texto: "Anulado",
      tono: "anulado",
    })
  })

  it("FINALIZADO + aprobado → 'Aprobado'", () => {
    expect(etiquetaHistorialIntento({ estado: "FINALIZADO", aprobado: true })).toEqual({
      texto: "Aprobado",
      tono: "aprobado",
    })
  })

  it("FINALIZADO + no aprobado → 'Aún no'", () => {
    expect(etiquetaHistorialIntento({ estado: "FINALIZADO", aprobado: false })).toEqual({
      texto: "Aún no",
      tono: "neutro",
    })
  })
})
