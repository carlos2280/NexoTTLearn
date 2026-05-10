import { AccionAuditoria } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../prisma/prisma.service"
import { AuditLogService } from "./audit-log.service"

interface MockPrisma {
  activityLog: {
    create: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): MockPrisma {
  return {
    activityLog: {
      create: vi.fn().mockResolvedValue(undefined),
    },
  }
}

let prisma: MockPrisma
let service: AuditLogService

beforeEach(() => {
  prisma = buildPrismaMock()
  service = new AuditLogService(prisma as unknown as PrismaService)
})

describe("AuditLogService.record", () => {
  it("happy path: invoca prisma.activityLog.create con todos los campos pasados", async () => {
    await service.record({
      usuarioId: "usr-1",
      accion: AccionAuditoria.LOGIN_OK,
      exito: true,
      recursoTipo: "usuario",
      recursoId: "usr-2",
      ip: "127.0.0.1",
      userAgent: "vitest",
      requestId: "req-1",
    })

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        usuarioId: "usr-1",
        accion: AccionAuditoria.LOGIN_OK,
        exito: true,
        recursoTipo: "usuario",
        recursoId: "usr-2",
        ip: "127.0.0.1",
        userAgent: "vitest",
        requestId: "req-1",
      },
    })
  })

  it("campos opcionales ausentes se persisten como null (no undefined)", async () => {
    await service.record({
      usuarioId: null,
      accion: AccionAuditoria.LOGIN_FAIL,
      exito: false,
    })

    expect(prisma.activityLog.create).toHaveBeenCalledWith({
      data: {
        usuarioId: null,
        accion: AccionAuditoria.LOGIN_FAIL,
        exito: false,
        recursoTipo: null,
        recursoId: null,
        ip: null,
        userAgent: null,
        requestId: null,
      },
    })
  })

  it("si el insert falla, NO propaga el error (fire-and-forget)", async () => {
    prisma.activityLog.create.mockRejectedValueOnce(new Error("conexion DB caida"))

    await expect(
      service.record({
        usuarioId: "usr-1",
        accion: AccionAuditoria.LOGOUT,
        exito: true,
      }),
    ).resolves.toBeUndefined()
  })
})
