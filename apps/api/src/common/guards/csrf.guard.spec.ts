import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express"
import { describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { CsrfGuard } from "./csrf.guard"

interface BuildContextOptions {
  readonly method?: string
  readonly headerToken?: string | undefined
  readonly sessionToken?: string | undefined
  readonly path?: string
}

function buildContext(options: BuildContextOptions): ExecutionContext {
  const headers: Record<string, string> = {}
  if (options.headerToken !== undefined) {
    headers["x-xsrf-token"] = options.headerToken
  }

  const request: Partial<Request> = {
    method: options.method ?? "POST",
    path: options.path ?? "/api/v1/recurso",
    headers,
    session: {
      ...(options.sessionToken !== undefined ? { csrfToken: options.sessionToken } : {}),
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

const TOKEN_VALIDO = "a".repeat(64)
const TOKEN_DISTINTO = "b".repeat(64)
const TOKEN_LARGO = "a".repeat(66)

describe("CsrfGuard", () => {
  it("permite metodos seguros (GET) sin necesidad de token", () => {
    const guard = new CsrfGuard(buildReflector(false))
    expect(guard.canActivate(buildContext({ method: "GET" }))).toBe(true)
  })

  it("permite endpoints @Public en POST sin token (login)", () => {
    const guard = new CsrfGuard(buildReflector(true))
    expect(guard.canActivate(buildContext({ method: "POST" }))).toBe(true)
  })

  it("rechaza POST sin header X-XSRF-TOKEN con codigo PROHIBIDO", () => {
    const guard = new CsrfGuard(buildReflector(false))
    try {
      guard.canActivate(buildContext({ method: "POST", sessionToken: TOKEN_VALIDO }))
      throw new Error("se esperaba que el guard lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException)
      const response = (error as ForbiddenException).getResponse() as { code: string }
      expect(response.code).toBe(apiErrorCodes.prohibido)
    }
  })

  it("rechaza POST con header pero sin token en sesion", () => {
    const guard = new CsrfGuard(buildReflector(false))
    expect(() =>
      guard.canActivate(buildContext({ method: "POST", headerToken: TOKEN_VALIDO })),
    ).toThrow(ForbiddenException)
  })

  it("permite POST con header igual al token de sesion", () => {
    const guard = new CsrfGuard(buildReflector(false))
    const ctx = buildContext({
      method: "POST",
      headerToken: TOKEN_VALIDO,
      sessionToken: TOKEN_VALIDO,
    })
    expect(guard.canActivate(ctx)).toBe(true)
  })

  it("rechaza POST con header de longitud distinta al de sesion", () => {
    const guard = new CsrfGuard(buildReflector(false))
    const ctx = buildContext({
      method: "POST",
      headerToken: TOKEN_LARGO,
      sessionToken: TOKEN_VALIDO,
    })
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })

  it("rechaza POST con header distinto al de sesion (timing-safe)", () => {
    const guard = new CsrfGuard(buildReflector(false))
    const ctx = buildContext({
      method: "POST",
      headerToken: TOKEN_DISTINTO,
      sessionToken: TOKEN_VALIDO,
    })
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException)
  })
})
