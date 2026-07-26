import { describe, expect, it } from "vitest"
import { calcularSeccionCompletada } from "./calcular-seccion-completada"

describe("calcularSeccionCompletada", () => {
  describe("soloLectura (curso CERRADO)", () => {
    it("siempre marca completada, independiente del modo y del plan", () => {
      const escenarios = [
        { modo: "asignado" as const, planCompletada: false, completadaSegunAvance: false },
        { modo: "voluntario" as const, planCompletada: undefined, completadaSegunAvance: false },
        { modo: "preview" as const, planCompletada: undefined, completadaSegunAvance: undefined },
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
          completadaSegunAvance: false,
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
          completadaSegunAvance: false,
        }),
      ).toBe(true)
    })

    it("el plan manda sobre el avance: si el plan dice que no, no se marca", () => {
      // El asignado sigue leyendo su PlanEstudio (fuente historica). El avance
      // solo aporta el conteo de bloques para el icono de reto.
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: false,
          completadaSegunAvance: true,
        }),
      ).toBe(false)
    })

    it("no marca completada si el plan aún no llegó", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: undefined,
          completadaSegunAvance: true,
        }),
      ).toBe(false)
    })
  })

  describe("modo voluntario (D-AS-1: sin plan personal)", () => {
    it("marca completada cuando el avance dice que la superó", () => {
      expect(
        calcularSeccionCompletada({
          modo: "voluntario",
          soloLectura: false,
          planCompletada: undefined,
          completadaSegunAvance: true,
        }),
      ).toBe(true)
    })

    it("P28: abrir la sección ya NO la marca completada si quedan bloques sin aprobar", () => {
      // El caso que rompia: el voluntario abria las 38 secciones y las veia
      // todas en verde, conviviendo con "92% completado" y el transversal
      // bloqueado sin explicacion. El avance (dominio) es ahora la fuente.
      expect(
        calcularSeccionCompletada({
          modo: "voluntario",
          soloLectura: false,
          planCompletada: undefined,
          completadaSegunAvance: false,
        }),
      ).toBe(false)
    })

    it("no marca completada si el avance aún no llegó (nunca inventa un verde)", () => {
      expect(
        calcularSeccionCompletada({
          modo: "voluntario",
          soloLectura: false,
          planCompletada: undefined,
          completadaSegunAvance: undefined,
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
          completadaSegunAvance: true,
        }),
      ).toBe(false)
    })
  })
})
