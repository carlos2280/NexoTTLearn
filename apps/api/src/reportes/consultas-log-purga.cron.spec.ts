import { Logger } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { ConsultasLogPurgaCron } from "./consultas-log-purga.cron"

interface PrismaMock {
  consultaLog: { deleteMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return { consultaLog: { deleteMany: vi.fn() } }
}

describe("ConsultasLogPurgaCron.ejecutar", () => {
  let prisma: PrismaMock
  let cron: ConsultasLogPurgaCron

  beforeEach(() => {
    prisma = buildPrismaMock()
    cron = new ConsultasLogPurgaCron(prisma as unknown as PrismaService)
  })

  it("borra filas con fecha < hace 90 dias", async () => {
    prisma.consultaLog.deleteMany.mockResolvedValue({ count: 0 })
    const antes = Date.now()
    await cron.ejecutar()
    const despues = Date.now()

    expect(prisma.consultaLog.deleteMany).toHaveBeenCalledTimes(1)
    const call = prisma.consultaLog.deleteMany.mock.calls[0]?.[0] as {
      where: { fecha: { lt: Date } }
    }
    const corte = call.where.fecha.lt.getTime()
    const ms90d = 90 * 24 * 60 * 60 * 1000
    expect(corte).toBeGreaterThanOrEqual(antes - ms90d)
    expect(corte).toBeLessThanOrEqual(despues - ms90d)
  })

  it("loggea resumen con filas y duracion", async () => {
    prisma.consultaLog.deleteMany.mockResolvedValue({ count: 5 })
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {
      /* silencio */
    })

    await cron.ejecutar()
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/consultas-purga \| filas=5 \| duracionMs=\d+/),
    )
    logSpy.mockRestore()
  })
})
