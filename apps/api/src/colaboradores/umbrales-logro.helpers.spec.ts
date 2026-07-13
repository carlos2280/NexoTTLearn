import { describe, expect, it } from "vitest"
import { UMBRALES_LOGRO_DEFAULT, parseUmbralesLogro } from "./umbrales-logro.helpers"

describe("parseUmbralesLogro", () => {
  it("devuelve el override del curso cuando el JSON es valido", () => {
    const raw = { excelencia: 90, solido: 75, enDesarrollo: 55 }
    expect(parseUmbralesLogro(raw)).toEqual(raw)
  })

  it("cae al canon del sistema cuando es null (curso sin override)", () => {
    expect(parseUmbralesLogro(null)).toEqual(UMBRALES_LOGRO_DEFAULT)
  })

  it("cae al canon cuando es undefined (snapshot legacy sin el bloque)", () => {
    expect(parseUmbralesLogro(undefined)).toEqual(UMBRALES_LOGRO_DEFAULT)
  })

  it.each([
    ["falta un campo", { excelencia: 90, solido: 75 }],
    ["campo no numerico", { excelencia: "90", solido: 75, enDesarrollo: 55 }],
    ["fuera de rango", { excelencia: 120, solido: 75, enDesarrollo: 55 }],
    ["campo extra (strict)", { excelencia: 90, solido: 75, enDesarrollo: 55, extra: 1 }],
    ["no es objeto", 42],
  ])("cae al canon cuando el JSON es invalido: %s", (_caso, raw) => {
    expect(parseUmbralesLogro(raw as never)).toEqual(UMBRALES_LOGRO_DEFAULT)
  })
})
