import { describe, expect, it } from "vitest"
import { PUNTAJES_FALTANTES_ERROR, calcularNotaTransversal } from "./calcular-nota-transversal"

describe("calcularNotaTransversal (D-S8-C4)", () => {
  const pesosDefault = { tests: 40, cualitativa: 30, comprension: 30 } as const
  const todasActivas = { tests: true, cualitativa: true, comprension: true } as const

  it("3/3 vivas - promedia ponderado con pesos por defecto", () => {
    const resultado = calcularNotaTransversal(
      { tests: 80, cualitativa: 70, comprension: 90 },
      pesosDefault,
      todasActivas,
    )
    // 0.4*80 + 0.3*70 + 0.3*90 = 32 + 21 + 27 = 80
    expect(resultado).toBe(80)
  })

  it("2/3 vivas - tests inactiva reescala pesos 30/30 -> 50/50", () => {
    const resultado = calcularNotaTransversal(
      { tests: null, cualitativa: 60, comprension: 80 },
      pesosDefault,
      { tests: false, cualitativa: true, comprension: true },
    )
    // (0.5*60) + (0.5*80) = 30 + 40 = 70
    expect(resultado).toBe(70)
  })

  it("2/3 vivas - capa activa pero sin nota se omite (D35)", () => {
    const resultado = calcularNotaTransversal(
      { tests: 50, cualitativa: null, comprension: 90 },
      pesosDefault,
      todasActivas,
    )
    // pesos vivos {tests:40, comprension:30} suman 70 -> reescalan a 4/7 y 3/7
    // (40/70)*50 + (30/70)*90 = 28.5714... + 38.5714... = 67.142857...
    // redondeo 2 dec = 67.14
    expect(resultado).toBe(67.14)
  })

  it("1/3 viva - solo cualitativa, devuelve esa nota exacta", () => {
    const resultado = calcularNotaTransversal(
      { tests: null, cualitativa: 85, comprension: null },
      pesosDefault,
      todasActivas,
    )
    expect(resultado).toBe(85)
  })

  it("0/3 vivas - lanza PUNTAJES_FALTANTES", () => {
    expect(() =>
      calcularNotaTransversal(
        { tests: null, cualitativa: null, comprension: null },
        pesosDefault,
        todasActivas,
      ),
    ).toThrowError(PUNTAJES_FALTANTES_ERROR)
  })

  it("redondea a 2 decimales (75.7777 -> 75.78)", () => {
    // Construyo: 0.4*75.5 + 0.3*76 + 0.3*75.6 = 30.2 + 22.8 + 22.68 = 75.68
    // Usemos algo que de 75.7777 con 3/3 vivas y pesos default.
    // tests=80, cualitativa=70, comprension=75.926 -> 32 + 21 + 22.7778 = 75.78
    const resultado = calcularNotaTransversal(
      { tests: 80, cualitativa: 70, comprension: 75.926 },
      pesosDefault,
      todasActivas,
    )
    expect(resultado).toBe(75.78)
  })

  it("redistribucion D35 - todas las capas con peso 0 lanza error", () => {
    expect(() =>
      calcularNotaTransversal(
        { tests: 70, cualitativa: 80, comprension: 90 },
        { tests: 0, cualitativa: 0, comprension: 0 },
        todasActivas,
      ),
    ).toThrowError(PUNTAJES_FALTANTES_ERROR)
  })

  it("capa inactiva con nota presente se ignora (no contribuye al promedio)", () => {
    const resultado = calcularNotaTransversal(
      { tests: 100, cualitativa: 60, comprension: 80 },
      pesosDefault,
      { tests: false, cualitativa: true, comprension: true },
    )
    // tests=100 deberia ignorarse: pesos vivos cualitativa+comprension
    expect(resultado).toBe(70) // 30/30 reescalado a 50/50: 30+40=70
  })
})
