import type { TestStdinStdout } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { decidirPaso, normalizarStdout } from "./comparar-stdout"
import type { ResultadoEjecucion } from "./types"

function ok(stdout: string): ResultadoEjecucion {
  return { id: "t1", estado: "ok", stdout, stderr: "", duracionMs: 1 }
}

function test(salidaEsperada: string): TestStdinStdout {
  return { id: "t1", descripcion: "", entrada: "", salidaEsperada, visible: true }
}

describe("normalizarStdout", () => {
  it("convierte CRLF en LF", () => {
    expect(normalizarStdout("hola\r\nmundo\r\n")).toBe("hola\nmundo")
  })

  it("recorta espacios y saltos finales pero conserva los iniciales", () => {
    expect(normalizarStdout("  hola  \n\n")).toBe("  hola")
  })

  it("no altera string vacío", () => {
    expect(normalizarStdout("")).toBe("")
  })
})

describe("decidirPaso", () => {
  it("pasa cuando stdout coincide tras normalizar", () => {
    expect(decidirPaso(ok("5\n"), test("5"))).toBe(true)
  })

  it("pasa cuando hay CRLF en stdout pero esperado usa LF", () => {
    expect(decidirPaso(ok("hola\r\nmundo\r\n"), test("hola\nmundo"))).toBe(true)
  })

  it("no pasa si el estado no es ok (timeout)", () => {
    const timeout: ResultadoEjecucion = {
      id: "t1",
      estado: "timeout",
      stdout: "5",
      stderr: "",
      duracionMs: 5000,
    }
    expect(decidirPaso(timeout, test("5"))).toBe(false)
  })

  it("no pasa si el estado no es ok (fallo)", () => {
    const fallo: ResultadoEjecucion = {
      id: "t1",
      estado: "fallo",
      stdout: "",
      stderr: "ReferenceError",
      duracionMs: 1,
    }
    expect(decidirPaso(fallo, test(""))).toBe(false)
  })

  it("no pasa si los stdouts difieren tras normalizar", () => {
    expect(decidirPaso(ok("5"), test("6"))).toBe(false)
  })
})
