import { Logger } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ArchivarNotificacionesCron } from "./archivar-notificaciones.cron"

interface PrismaMock {
  notificacion: { updateMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    notificacion: { updateMany: vi.fn() },
  }
}

describe("ArchivarNotificacionesCron.ejecutar", () => {
  let prisma: PrismaMock
  let cron: ArchivarNotificacionesCron

  beforeEach(() => {
    prisma = buildPrismaMock()
    cron = new ArchivarNotificacionesCron(prisma as unknown as PrismaService)
  })

  it("invoca updateMany con WHERE archivada=false y fechaCreacion < hace 30 dias", async () => {
    prisma.notificacion.updateMany.mockResolvedValue({ count: 0 })

    const antes = Date.now()
    await cron.ejecutar()
    const despues = Date.now()

    expect(prisma.notificacion.updateMany).toHaveBeenCalledTimes(1)
    const call = prisma.notificacion.updateMany.mock.calls[0]?.[0] as {
      where: { archivada: false; fechaCreacion: { lt: Date } }
      data: { archivada: true }
    }
    expect(call.where.archivada).toBe(false)
    expect(call.data.archivada).toBe(true)
    const corte = call.where.fechaCreacion.lt.getTime()
    const ms30d = 30 * 24 * 60 * 60 * 1000
    expect(corte).toBeGreaterThanOrEqual(antes - ms30d)
    expect(corte).toBeLessThanOrEqual(despues - ms30d)
  })

  it("loggea resumen con filas afectadas y duracion", async () => {
    prisma.notificacion.updateMany.mockResolvedValue({ count: 7 })
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {
      /* silencio durante el test */
    })

    await cron.ejecutar()

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/archivar-notif \| filas=7 \| duracionMs=\d+/),
    )
    logSpy.mockRestore()
  })

  it("ejecuta sin error cuando no hay filas a archivar", async () => {
    prisma.notificacion.updateMany.mockResolvedValue({ count: 0 })
    await expect(cron.ejecutar()).resolves.toBeUndefined()
  })
})
