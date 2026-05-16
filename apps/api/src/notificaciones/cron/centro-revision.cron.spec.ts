import { Logger } from "@nestjs/common"
import { TipoEventoNotif } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../../common/prisma/prisma.service"
import { NotificacionesService } from "../notificaciones.service"
import { CentroRevisionCron } from "./centro-revision.cron"

interface PrismaMock {
  notificacion: { findFirst: ReturnType<typeof vi.fn> }
  intentoTransversal: { count: ReturnType<typeof vi.fn> }
  intentoEntrevistaIA: { count: ReturnType<typeof vi.fn> }
  usuario: { findMany: ReturnType<typeof vi.fn> }
}

interface NotifMock {
  crear: ReturnType<typeof vi.fn>
}

function buildMocks(): { prisma: PrismaMock; notif: NotifMock } {
  return {
    prisma: {
      notificacion: { findFirst: vi.fn().mockResolvedValue(null) },
      intentoTransversal: { count: vi.fn().mockResolvedValue(0) },
      intentoEntrevistaIA: { count: vi.fn().mockResolvedValue(0) },
      usuario: { findMany: vi.fn().mockResolvedValue([]) },
    },
    notif: {
      crear: vi.fn().mockResolvedValue({
        creada: true,
        notificacionId: "n",
        canalesEnviados: ["IN_APP"],
      }),
    },
  }
}

describe("CentroRevisionCron.ejecutar", () => {
  let m: ReturnType<typeof buildMocks>
  let cron: CentroRevisionCron

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-13T08:00:00.000Z"))
    m = buildMocks()
    cron = new CentroRevisionCron(
      m.prisma as unknown as PrismaService,
      m.notif as unknown as NotificacionesService,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("total=0: no emite y loguea 'digest sin items'", async () => {
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)
    await cron.ejecutar()
    expect(m.notif.crear).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("digest sin items"))
    logSpy.mockRestore()
  })

  it("total>=1: broadcast a admins activos con desglose por tipo y fechaCorte", async () => {
    m.prisma.intentoTransversal.count.mockResolvedValue(3)
    m.prisma.intentoEntrevistaIA.count.mockResolvedValue(2)
    m.prisma.usuario.findMany.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }])

    await cron.ejecutar()

    expect(m.notif.crear).toHaveBeenCalledTimes(2)
    expect(m.notif.crear).toHaveBeenNthCalledWith(1, {
      usuarioId: "admin-1",
      tipo: TipoEventoNotif.CENTRO_REVISION,
      payload: {
        totalPendientes: 5,
        porTipo: { transversales: 3, entrevistasIa: 2 },
        fechaCorte: "2026-05-13",
      },
    })
  })

  it("idempotencia diaria: si ya existe fila CENTRO_REVISION hoy, NO emite", async () => {
    m.prisma.notificacion.findFirst.mockResolvedValue({ id: "n-ya-emitida" })
    m.prisma.intentoTransversal.count.mockResolvedValue(5)
    m.prisma.intentoEntrevistaIA.count.mockResolvedValue(1)
    m.prisma.usuario.findMany.mockResolvedValue([{ id: "admin-1" }])

    await cron.ejecutar()

    expect(m.notif.crear).not.toHaveBeenCalled()
    expect(m.prisma.intentoTransversal.count).not.toHaveBeenCalled()
    expect(m.prisma.intentoEntrevistaIA.count).not.toHaveBeenCalled()
  })

  it("0 admins activos: broadcast hace warn pero NO lanza", async () => {
    m.prisma.intentoTransversal.count.mockResolvedValue(2)
    m.prisma.usuario.findMany.mockResolvedValue([])
    const warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined)

    await cron.ejecutar()

    expect(m.notif.crear).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no-admins-activos"))
    warnSpy.mockRestore()
  })

  it("idempotencia consulta findFirst con discriminante usuarioId=null (broadcast)", async () => {
    m.prisma.intentoTransversal.count.mockResolvedValue(1)
    m.prisma.usuario.findMany.mockResolvedValue([{ id: "admin-1" }])
    await cron.ejecutar()
    const arg = m.prisma.notificacion.findFirst.mock.calls[0]?.[0] as {
      where: { tipoEvento: string; usuarioId?: string }
    }
    expect(arg.where.tipoEvento).toBe(TipoEventoNotif.CENTRO_REVISION)
    expect("usuarioId" in arg.where).toBe(false)
  })

  it("error en queries de conteo no propaga — try/catch global loguea warn", async () => {
    m.prisma.intentoTransversal.count.mockRejectedValue(new Error("db down"))
    const warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined)

    await expect(cron.ejecutar()).resolves.toBeUndefined()

    expect(m.notif.crear).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("centro-revision | fallo"))
    warnSpy.mockRestore()
  })
})
