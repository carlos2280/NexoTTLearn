import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { describe, expect, it, vi } from "vitest"
import { PrismaService } from "../prisma/prisma.service"
import { MustSetupMfaGuard } from "./must-setup-mfa.guard"

interface MockPrisma {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(requiereSetupMfa: boolean | null): MockPrisma {
  return {
    usuario: {
      findUnique: vi
        .fn()
        .mockResolvedValue(requiereSetupMfa === null ? null : { requiereSetupMfa }),
    },
  }
}

function buildContext(method: string, path: string, usuarioId?: string): ExecutionContext {
  const request = {
    method,
    path,
    session: usuarioId ? { usuarioId } : undefined,
  }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext
}

describe("MustSetupMfaGuard", () => {
  it("deja pasar si la sesion no esta autenticada (delegacion al SesionGuard)", async () => {
    const prisma = buildPrismaMock(false)
    const guard = new MustSetupMfaGuard(prisma as unknown as PrismaService)
    const allow = await guard.canActivate(buildContext("GET", "/api/v1/auth/me"))
    expect(allow).toBe(true)
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled()
  })

  it("deja pasar si requiereSetupMfa = false", async () => {
    const prisma = buildPrismaMock(false)
    const guard = new MustSetupMfaGuard(prisma as unknown as PrismaService)
    const allow = await guard.canActivate(buildContext("GET", "/api/v1/colaboradores", "u1"))
    expect(allow).toBe(true)
  })

  it("permite ruta de la allow-list cuando requiereSetupMfa = true", async () => {
    const prisma = buildPrismaMock(true)
    const guard = new MustSetupMfaGuard(prisma as unknown as PrismaService)
    const allow = await guard.canActivate(buildContext("POST", "/api/v1/auth/mfa/setup", "u1"))
    expect(allow).toBe(true)
  })

  it("permite GET /auth/me incluso con setup pendiente", async () => {
    const prisma = buildPrismaMock(true)
    const guard = new MustSetupMfaGuard(prisma as unknown as PrismaService)
    const allow = await guard.canActivate(buildContext("GET", "/auth/me", "u1"))
    expect(allow).toBe(true)
  })

  it("bloquea ruta fuera de la allow-list con SETUP_MFA_REQUERIDO", async () => {
    const prisma = buildPrismaMock(true)
    const guard = new MustSetupMfaGuard(prisma as unknown as PrismaService)
    await expect(
      guard.canActivate(buildContext("POST", "/api/v1/colaboradores", "u1")),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "SETUP_MFA_REQUERIDO" }),
    })
    expect(ForbiddenException).toBeDefined()
  })
})
