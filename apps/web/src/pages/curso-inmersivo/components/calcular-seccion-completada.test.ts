import { describe, expect, it } from "vitest"
import { calcularSeccionCompletada } from "./calcular-seccion-completada"

describe("calcularSeccionCompletada", () => {
  describe("soloLectura (curso CERRADO)", () => {
    it("siempre marca completada, independiente del modo y del plan", () => {
      const escenarios = [
        { modo: "asignado" as const, planCompletada: false, abiertaPorAperturas: false },
        { modo: "voluntario" as const, planCompletada: undefined, abiertaPorAperturas: false },
        { modo: "preview" as const, planCompletada: undefined, abiertaPorAperturas: false },
      ]
      for (const input of escenarios) {
        expect(calcularSeccionCompletada({ ...input, soloLectura: true })).toBe(true)
      }
    })

    it("soloLectura dispara antes que cualquier otra senal (asignado + planCompletada=true)", () => {
      // Short-circuit explicito: soloLectura siempre gana, no depende del plan.
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: true,
          planCompletada: true,
          abiertaPorAperturas: false,
        }),
      ).toBe(true)
    })
  })

  describe("modo asignado (BUG-QA-3: la apertura sola NO marca completada)", () => {
    it("completada solo cuando PlanEstudio.completada === true", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: true,
          abiertaPorAperturas: false,
        }),
      ).toBe(true)
    })

    it("NO marca completada si solo está abierta por AperturaSeccion (evita contradicción 9/22 con 22 checks)", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: false,
          abiertaPorAperturas: true,
        }),
      ).toBe(false)
    })

    it("no marca completada si el plan aún no llegó", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: undefined,
          abiertaPorAperturas: true,
        }),
      ).toBe(false)
    })
  })

  describe("modo voluntario (D-AS-1: sin plan personal)", () => {
    it("marca completada cuando hay AperturaSeccion", () => {
      expect(
        calcularSeccionCompletada({
          modo: "voluntario",
          soloLectura: false,
          planCompletada: undefined,
          abiertaPorAperturas: true,
        }),
      ).toBe(true)
    })

    it("no marca completada si la sección nunca se abrió", () => {
      expect(
        calcularSeccionCompletada({
          modo: "voluntario",
          soloLectura: false,
          planCompletada: undefined,
          abiertaPorAperturas: false,
        }),
      ).toBe(false)
    })
  })

  describe("modo preview (catálogo sin inscripción)", () => {
    it("nunca marca completada", () => {
      expect(
        calcularSeccionCompletada({
          modo: "preview",
          soloLectura: false,
          planCompletada: undefined,
          abiertaPorAperturas: true,
        }),
      ).toBe(false)
    })
  })
})
