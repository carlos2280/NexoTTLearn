import { Logger } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { ConsultasLogService } from "./consultas-log.service"

interface PrismaMock {
  consultaLog: {
    create: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return { consultaLog: { create: vi.fn().mockResolvedValue(undefined) } }
}

describe("ConsultasLogService.registrar", () => {
  let prisma: PrismaMock
  let service: ConsultasLogService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new ConsultasLogService(prisma as unknown as PrismaService)
  })

  it("puebla las 5 columnas de negocio + tipoLog + filtros (DE-P11c-1)", async () => {
    await service.registrar({
      autorUsuarioId: "user-1",
      endpoint: "/reportes/eficacia-plataforma",
      queryParams: { clienteId: "x" },
      latenciaMs: 42,
    })

    expect(prisma.consultaLog.create).toHaveBeenCalledTimes(1)
    const call = prisma.consultaLog.create.mock.calls[0]?.[0] as {
      data: {
        autorUsuarioId: string
        endpoint: string
        queryParams: Record<string, unknown>
        latenciaMs: number | null
        tipoLog: string
        filtros: unknown
      }
    }
    expect(call.data.autorUsuarioId).toBe("user-1")
    expect(call.data.endpoint).toBe("/reportes/eficacia-plataforma")
    expect(call.data.queryParams).toEqual({ clienteId: "x" })
    expect(call.data.latenciaMs).toBe(42)
    // legacy duplicado §5.129
    expect(call.data.tipoLog).toBe("/reportes/eficacia-plataforma")
    expect(call.data.filtros).toEqual({ clienteId: "x" })
  })

  it("acepta latenciaMs ausente como null", async () => {
    await service.registrar({
      autorUsuarioId: "user-1",
      endpoint: "/reportes/x",
      queryParams: {},
    })
    const call = prisma.consultaLog.create.mock.calls[0]?.[0] as {
      data: { latenciaMs: number | null }
    }
    expect(call.data.latenciaMs).toBeNull()
  })

  it("no propaga error si el INSERT falla — loggea con warn", async () => {
    prisma.consultaLog.create.mockRejectedValueOnce(new Error("DB down"))
    const warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {
      /* silencio */
    })

    await expect(
      service.registrar({
        autorUsuarioId: "user-1",
        endpoint: "/reportes/x",
        queryParams: {},
      }),
    ).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
