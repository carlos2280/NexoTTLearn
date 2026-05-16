import { BadRequestException, ExecutionContext } from "@nestjs/common"
import { Request } from "express"
import { describe, expect, it } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { extractMotivo } from "./motivo.decorator"

function buildContext(motivo: string | undefined): ExecutionContext {
  const headers: Record<string, string> = {}
  if (motivo !== undefined) {
    headers["x-motivo"] = motivo
  }
  const request: Partial<Request> = {
    method: "POST",
    path: "/api/v1/recurso",
    headers,
  }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
    getHandler: () => () => undefined,
    getClass: () => class Anon {},
  } as unknown as ExecutionContext
}

describe("extractMotivo (factory del decorator @Motivo)", () => {
  it("devuelve undefined cuando el header esta ausente", () => {
    expect(extractMotivo(undefined, buildContext(undefined))).toBeUndefined()
  })

  it("devuelve undefined cuando el header es solo whitespace", () => {
    expect(extractMotivo(undefined, buildContext("   "))).toBeUndefined()
    expect(extractMotivo(undefined, buildContext("\t \n"))).toBeUndefined()
  })

  it("devuelve el valor trimmed cuando contiene caracteres permitidos", () => {
    expect(extractMotivo(undefined, buildContext("  Lanzamiento Q2  "))).toBe("Lanzamiento Q2")
    expect(extractMotivo(undefined, buildContext("ajuste de rubrica"))).toBe("ajuste de rubrica")
    expect(extractMotivo(undefined, buildContext("off-boarding"))).toBe("off-boarding")
    expect(extractMotivo(undefined, buildContext("Test e2e: alta con MFA"))).toBe(
      "Test e2e: alta con MFA",
    )
  })

  it.each([
    ["con salto de linea LF", "motivo\nmalicioso"],
    ["con carriage return", "motivo\rmalicioso"],
    ["con CRLF", "motivo\r\nmalicioso"],
    ["con NUL", "motivo\u0000malicioso"],
    ["con HTML/script", "<script>alert(1)</script>"],
    ["con tabulador interno", "motivo\tcon\ttab"],
    ["con caracter no permitido & ", "ajuste & cambio"],
  ])("lanza BadRequestException motivoInvalido %s", (_label, raw) => {
    try {
      extractMotivo(undefined, buildContext(raw))
      throw new Error("se esperaba que el decorator lanzara BadRequestException")
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      const response = (error as BadRequestException).getResponse() as { code: string }
      expect(response.code).toBe(apiErrorCodes.motivoInvalido)
    }
  })

  it("lanza BadRequestException motivoInvalido cuando excede 500 caracteres", () => {
    const muyLargo = "a".repeat(501)
    try {
      extractMotivo(undefined, buildContext(muyLargo))
      throw new Error("se esperaba que el decorator lanzara BadRequestException")
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      const response = (error as BadRequestException).getResponse() as { code: string }
      expect(response.code).toBe(apiErrorCodes.motivoInvalido)
    }
  })

  it("acepta exactamente 500 caracteres validos", () => {
    const limite = "a".repeat(500)
    expect(extractMotivo(undefined, buildContext(limite))).toBe(limite)
  })
})
