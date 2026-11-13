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

  describe("modo asignado (regla unica del avance, #83)", () => {
    // Desde el #83 el % del asignado cuenta TODAS las secciones del curso, y el
    // estado por seccion del avance las cubre todas. El check sale de ahi, igual
    // que en el voluntario: si no, una seccion fuera del plan (sin skill) que ya
    // cuenta en el % y en el contador nunca se pintaria en verde.
    it("marca completada una seccion fuera del plan cuando el avance la da por superada", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: undefined,
          completadaSegunAvance: true,
        }),
      ).toBe(true)
    })

    it("el avance manda sobre el plan", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: true,
          completadaSegunAvance: false,
        }),
      ).toBe(false)
    })

    it("mientras el avance no llega, usa el plan", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: true,
          completadaSegunAvance: undefined,
        }),
      ).toBe(true)
    })

    it("sin avance ni plan no marca nada (nunca inventa un verde)", () => {
      expect(
        calcularSeccionCompletada({
          modo: "asignado",
          soloLectura: false,
          planCompletada: undefined,
          completadaSegunAvance: undefined,
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
