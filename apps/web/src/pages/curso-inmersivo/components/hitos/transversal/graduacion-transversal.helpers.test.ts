import { describe, expect, it } from "vitest"
import { notaEntera, notaEnteraNoAprobado, tituloGraduado } from "./graduacion-transversal.helpers"

describe("tituloGraduado", () => {
  it("≥ 85% del umbral → 'Casi lo tienes.'", () => {
    expect(tituloGraduado(69, 70)).toBe("Casi lo tienes.") // 0.986
    expect(tituloGraduado(60, 70)).toBe("Casi lo tienes.") // 0.857
  })

  it("justo en el corte del 85% → 'Casi lo tienes.'", () => {
    expect(tituloGraduado(85, 100)).toBe("Casi lo tienes.") // 0.85 exacto
  })

  it("entre 50% y 85% del umbral → 'Vas por buen camino.'", () => {
    expect(tituloGraduado(59, 70)).toBe("Vas por buen camino.") // 0.842
    expect(tituloGraduado(50, 70)).toBe("Vas por buen camino.") // 0.714
  })

  it("justo en el corte del 50% → 'Vas por buen camino.'", () => {
    expect(tituloGraduado(35, 70)).toBe("Vas por buen camino.") // 0.5 exacto
  })

  it("< 50% del umbral → 'Es un comienzo.'", () => {
    expect(tituloGraduado(34, 70)).toBe("Es un comienzo.") // 0.485
    expect(tituloGraduado(15, 70)).toBe("Es un comienzo.") // 0.214 — el bug del "Casi" mentiroso
    expect(tituloGraduado(0, 70)).toBe("Es un comienzo.")
  })

  it("escala con cualquier umbral (proporción, no puntos fijos)", () => {
    expect(tituloGraduado(80, 90)).toBe("Casi lo tienes.") // 0.888
    expect(tituloGraduado(45, 90)).toBe("Vas por buen camino.") // 0.5
    expect(tituloGraduado(44, 90)).toBe("Es un comienzo.") // 0.489
  })

  it("umbral 0 o negativo → banda más alta, sin dividir por cero", () => {
    expect(tituloGraduado(0, 0)).toBe("Casi lo tienes.")
    expect(tituloGraduado(10, -5)).toBe("Casi lo tienes.")
  })
})

describe("notaEntera", () => {
  it("redondea al entero más cercano", () => {
    expect(notaEntera(87)).toBe(87)
    expect(notaEntera(68.33)).toBe(68)
    expect(notaEntera(68.6)).toBe(69)
    expect(notaEntera(74.5)).toBe(75)
    expect(notaEntera(0)).toBe(0)
  })
})

describe("notaEnteraNoAprobado", () => {
  it("nota lejos del umbral → redondeo normal", () => {
    expect(notaEnteraNoAprobado(55, 70)).toBe(55)
    expect(notaEnteraNoAprobado(15, 70)).toBe(15)
  })

  it("nota que redondearía AL umbral pese a no aprobar → capada a umbral-1", () => {
    // 69.6 redondea a 70 = umbral; mostrarlo diría "70 · necesitas 70" en una
    // pantalla de "no aprobaste". Se capa a 69.
    expect(notaEnteraNoAprobado(69.6, 70)).toBe(69)
  })

  it("respeta umbrales decimales redondeándolos", () => {
    expect(notaEnteraNoAprobado(0.6, 1)).toBe(0)
  })

  it("nunca devuelve negativo (blindaje umbral 0)", () => {
    expect(notaEnteraNoAprobado(0, 0)).toBe(0)
  })
})
