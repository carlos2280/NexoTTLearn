import { ExecutionContext, UnprocessableEntityException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express"
import { describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { MotivoGuard } from "./motivo.guard"

interface BuildContextOptions {
  readonly motivo?: string | undefined
}

function buildContext(options: BuildContextOptions): ExecutionContext {
  const headers: Record<string, string> = {}
  if (options.motivo !== undefined) {
    headers["x-motivo"] = options.motivo
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

function buildReflector(requiere: boolean | undefined): Reflector {
  const reflector = new Reflector()
  vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(requiere)
  return reflector
}

describe("MotivoGuard", () => {
  it("permite el acceso cuando @RequiereMotivo no esta presente", () => {
    const guard = new MotivoGuard(buildReflector(undefined))
    expect(guard.canActivate(buildContext({}))).toBe(true)
  })

  it("permite el acceso cuando hay header X-Motivo no vacio", () => {
    const guard = new MotivoGuard(buildReflector(true))
    expect(guard.canActivate(buildContext({ motivo: "Olvido el password" }))).toBe(true)
  })

  it("rechaza con 422 MOTIVO_REQUERIDO cuando falta o solo es whitespace", () => {
    const guard = new MotivoGuard(buildReflector(true))
    try {
      guard.canActivate(buildContext({ motivo: "   " }))
      throw new Error("se esperaba que el guard lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException)
      const response = (error as UnprocessableEntityException).getResponse() as { code: string }
      expect(response.code).toBe(apiErrorCodes.motivoRequerido)
    }
  })
})
