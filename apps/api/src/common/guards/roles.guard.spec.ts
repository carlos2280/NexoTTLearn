import { ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { RolUsuario } from "@prisma/client"
import { Request } from "express"
import { describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { RolesGuard } from "./roles.guard"

interface BuildContextOptions {
  readonly rol?: RolUsuario | undefined
  readonly path?: string
}

function buildContext(options: BuildContextOptions): ExecutionContext {
  const request: Partial<Request> = {
    method: "POST",
    path: options.path ?? "/api/v1/recurso",
    session: {
      ...(options.rol !== undefined ? { rol: options.rol } : {}),
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

function buildReflector(metadata: readonly RolUsuario[] | undefined): Reflector {
  const reflector = new Reflector()
  vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(metadata)
  return reflector
}

describe("RolesGuard", () => {
  it("permite el acceso cuando no hay metadata @Roles", () => {
    const guard = new RolesGuard(buildReflector(undefined))
    expect(guard.canActivate(buildContext({ rol: RolUsuario.PARTICIPANTE }))).toBe(true)
  })

  it("permite el acceso cuando el rol esta en la lista requerida", () => {
    const guard = new RolesGuard(buildReflector([RolUsuario.ADMIN]))
    expect(guard.canActivate(buildContext({ rol: RolUsuario.ADMIN }))).toBe(true)
  })

  it("rechaza con ForbiddenException cuando el rol no esta autorizado", () => {
    const guard = new RolesGuard(buildReflector([RolUsuario.ADMIN]))
    try {
      guard.canActivate(buildContext({ rol: RolUsuario.PARTICIPANTE }))
      throw new Error("se esperaba que el guard lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException)
      const response = (error as ForbiddenException).getResponse() as { code: string }
      expect(response.code).toBe(apiErrorCodes.prohibido)
    }
  })

  it("rechaza con UnauthorizedException cuando llega sin sesion (defensa en profundidad)", () => {
    const guard = new RolesGuard(buildReflector([RolUsuario.ADMIN]))
    expect(() => guard.canActivate(buildContext({ rol: undefined }))).toThrow(UnauthorizedException)
  })
})
