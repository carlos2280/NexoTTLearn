import { describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { HealthService } from "./health.service"

interface PrismaMock {
  readonly $queryRaw: ReturnType<typeof vi.fn>
}

function buildPrismaMock(impl: () => Promise<unknown>): PrismaMock {
  return { $queryRaw: vi.fn().mockImplementation(impl) }
}

describe("HealthService", () => {
  it("devuelve 'ok' cuando $queryRaw responde", async () => {
    const prisma = buildPrismaMock(() => Promise.resolve([{ ok: 1 }]))
    const service = new HealthService(prisma as unknown as PrismaService)

    const result = await service.chequearBaseDatos()

    expect(result).toBe("ok")
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1)
  })

  it("devuelve 'down' cuando $queryRaw lanza", async () => {
    const prisma = buildPrismaMock(() => Promise.reject(new Error("conexion rechazada")))
    const service = new HealthService(prisma as unknown as PrismaService)

    const result = await service.chequearBaseDatos()

    expect(result).toBe("down")
  })
})
