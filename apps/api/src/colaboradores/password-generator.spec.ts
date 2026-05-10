import { describe, expect, it } from "vitest"
import { generarPasswordSegura } from "./password-generator"

const REGEX_FORTALEZA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/
const REGEX_TIENE_SIMBOLO = /[!@#$%&*]/

describe("generarPasswordSegura", () => {
  it("devuelve una password de longitud ≥ 12 que cumple la regex de fortaleza", () => {
    for (let i = 0; i < 50; i += 1) {
      const password = generarPasswordSegura()
      expect(password.length).toBeGreaterThanOrEqual(12)
      expect(REGEX_FORTALEZA.test(password)).toBe(true)
      expect(REGEX_TIENE_SIMBOLO.test(password)).toBe(true)
    }
  })

  it("incluye al menos un caracter de cada clase", () => {
    const password = generarPasswordSegura()
    expect(/[a-z]/.test(password)).toBe(true)
    expect(/[A-Z]/.test(password)).toBe(true)
    expect(/\d/.test(password)).toBe(true)
    expect(REGEX_TIENE_SIMBOLO.test(password)).toBe(true)
  })

  it("no es deterministica entre llamadas consecutivas", () => {
    const generated = new Set<string>()
    for (let i = 0; i < 20; i += 1) {
      generated.add(generarPasswordSegura())
    }
    expect(generated.size).toBeGreaterThan(15)
  })
})
