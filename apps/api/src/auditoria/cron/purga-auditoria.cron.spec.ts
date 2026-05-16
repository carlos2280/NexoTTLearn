import { Logger } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../../common/prisma/prisma.service"
import { PurgaAuditoriaCron } from "./purga-auditoria.cron"

interface PrismaMock {
  readonly $executeRaw: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  return { $executeRaw: vi.fn() }
}

describe("PurgaAuditoriaCron.ejecutar", () => {
  let prisma: PrismaMock
  let cron: PurgaAuditoriaCron

  beforeEach(() => {
    prisma = buildPrismaMock()
    cron = new PurgaAuditoriaCron(prisma as unknown as PrismaService)
  })

  it("no itera mas si la primera batched devuelve 0", async () => {
    prisma.$executeRaw.mockResolvedValueOnce(0)
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)

    await cron.ejecutar()

    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/purga-auditoria \| borradas=0 \| iteraciones=1 \| duracionMs=\d+/),
    )
    logSpy.mockRestore()
  })

  it("itera hasta agotar (batch de 1000 -> 1000 -> 0)", async () => {
    prisma.$executeRaw
      .mockResolvedValueOnce(1000)
      .mockResolvedValueOnce(1000)
      .mockResolvedValueOnce(0)
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)

    await cron.ejecutar()

    expect(prisma.$executeRaw).toHaveBeenCalledTimes(3)
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/purga-auditoria \| borradas=2000 \| iteraciones=3 \| duracionMs=\d+/),
    )
    logSpy.mockRestore()
  })

  it("try/catch global: un fallo del SQL no propaga", async () => {
    prisma.$executeRaw
      .mockResolvedValueOnce(1000)
      .mockRejectedValueOnce(new Error("conexion perdida"))
    const warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined)

    await expect(cron.ejecutar()).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /purga-auditoria \| fallo \| borradas=1000 \| iteraciones=2 \| error=conexion perdida/,
      ),
    )
    warnSpy.mockRestore()
  })

  it("acumula borradas a traves de las iteraciones", async () => {
    prisma.$executeRaw
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(750)
      .mockResolvedValueOnce(0)
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)

    await cron.ejecutar()

    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/borradas=1250/))
    logSpy.mockRestore()
  })

  it("el SQL parametriza INTERVAL via Prisma.sql (no $executeRawUnsafe)", async () => {
    prisma.$executeRaw.mockResolvedValueOnce(0)

    await cron.ejecutar()

    const call = prisma.$executeRaw.mock.calls[0]
    expect(call).toBeDefined()
    // Prisma.sql produce un objeto con strings + values.
    const arg = call?.[0] as { readonly strings?: readonly string[]; readonly values?: unknown[] }
    expect(arg.strings).toBeDefined()
    const sqlPlano = arg.strings?.join("") ?? ""
    expect(sqlPlano).toContain("DELETE FROM")
    expect(sqlPlano).toContain("activity_logs")
    expect(sqlPlano).toContain("ORDER BY")
    expect(sqlPlano).toContain("LIMIT")
  })
})
