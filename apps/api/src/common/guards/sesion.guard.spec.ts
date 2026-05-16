import { ExecutionContext, UnauthorizedException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express"
import { describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { SesionGuard } from "./sesion.guard"

interface BuildContextOptions {
  readonly usuarioId?: string
  readonly csrfToken?: string
  readonly method?: string
  readonly path?: string
}

function buildContext(options: BuildContextOptions): ExecutionContext {
  const request: Partial<Request> = {
    method: options.method ?? "GET",
    path: options.path ?? "/api/v1/recurso",
    session: {
      ...(options.usuarioId !== undefined ? { usuarioId: options.usuarioId } : {}),
      ...(options.csrfToken !== undefined ? { csrfToken: options.csrfToken } : {}),
    } as Request["session"],
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

function buildReflector(isPublic: boolean): Reflector {
  const reflector = new Reflector()
  vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(isPublic)
  return reflector
}

describe("SesionGuard", () => {
  it("permite acceso a endpoints @Public sin sesion", () => {
    const guard = new SesionGuard(buildReflector(true))
    expect(guard.canActivate(buildContext({}))).toBe(true)
  })

  it("rechaza endpoints privados sin sesion con codigo NO_AUTENTICADO", () => {
    const guard = new SesionGuard(buildReflector(false))
    try {
      guard.canActivate(buildContext({}))
      throw new Error("se esperaba que el guard lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException)
      const response = (error as UnauthorizedException).getResponse() as { code: string }
      expect(response.code).toBe(apiErrorCodes.noAutenticado)
    }
  })

  it("permite acceso a endpoints privados cuando hay usuarioId en sesion", () => {
    const guard = new SesionGuard(buildReflector(false))
    expect(guard.canActivate(buildContext({ usuarioId: "u-1" }))).toBe(true)
  })
})
