import { Logger } from "@nestjs/common"
import { TipoEventoNotif } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../../common/prisma/prisma.service"
import { NotificacionesService } from "../notificaciones.service"
import { RecordatorioDeadlineCron } from "./recordatorio-deadline.cron"

interface PrismaMock {
  curso: { findMany: ReturnType<typeof vi.fn> }
  asignacionCurso: { findMany: ReturnType<typeof vi.fn> }
  notificacion: { findFirst: ReturnType<typeof vi.fn> }
}

interface NotifMock {
  crear: ReturnType<typeof vi.fn>
}

function buildMocks(): { prisma: PrismaMock; notif: NotifMock } {
  return {
    prisma: {
      curso: { findMany: vi.fn() },
      asignacionCurso: { findMany: vi.fn() },
      notificacion: { findFirst: vi.fn().mockResolvedValue(null) },
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

describe("RecordatorioDeadlineCron.ejecutar", () => {
  let m: ReturnType<typeof buildMocks>
  let cron: RecordatorioDeadlineCron

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-13T08:00:00.000Z"))
    m = buildMocks()
    cron = new RecordatorioDeadlineCron(
      m.prisma as unknown as PrismaService,
      m.notif as unknown as NotificacionesService,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("sin cursos en T+7 ni T+1: no emite y termina sin error", async () => {
    m.prisma.curso.findMany.mockResolvedValue([])
    await cron.ejecutar()
    expect(m.prisma.curso.findMany).toHaveBeenCalledTimes(2)
    expect(m.notif.crear).not.toHaveBeenCalled()
  })

  it("emite RECORDATORIO_DEADLINE por cada asignacion activa del curso en T+7", async () => {
    m.prisma.curso.findMany.mockImplementation(
      (arg: { where: { fechaDeadline: { gte: Date } } }) => {
        const gte = arg.where.fechaDeadline.gte.getTime()
        const t7 = new Date("2026-05-20T00:00:00.000Z").getTime()
        if (gte === t7) {
          return Promise.resolve([
            {
              id: "curso-1",
              titulo: "Curso uno",
              fechaDeadline: new Date("2026-05-20T15:00:00.000Z"),
            },
          ])
        }
        return Promise.resolve([])
      },
    )
    m.prisma.asignacionCurso.findMany.mockResolvedValue([
      { id: "a-1", colaborador: { usuario: { id: "u-1" } } },
      { id: "a-2", colaborador: { usuario: { id: "u-2" } } },
    ])

    await cron.ejecutar()

    expect(m.notif.crear).toHaveBeenCalledTimes(2)
    expect(m.notif.crear).toHaveBeenNthCalledWith(1, {
      usuarioId: "u-1",
      tipo: TipoEventoNotif.RECORDATORIO_DEADLINE,
      payload: {
        asignacionId: "a-1",
        cursoId: "curso-1",
        cursoTitulo: "Curso uno",
        fechaDeadline: "2026-05-20",
        diasRestantes: 7,
      },
    })
  })

  it("idempotencia: si ya hay fila del dia para (usuario, tipo), NO reemite", async () => {
    m.prisma.curso.findMany.mockImplementation(
      (arg: { where: { fechaDeadline: { gte: Date } } }) => {
        const gte = arg.where.fechaDeadline.gte.getTime()
        const t1 = new Date("2026-05-14T00:00:00.000Z").getTime()
        if (gte === t1) {
          return Promise.resolve([
            {
              id: "curso-1",
              titulo: "Curso uno",
              fechaDeadline: new Date("2026-05-14T10:00:00.000Z"),
            },
          ])
        }
        return Promise.resolve([])
      },
    )
    m.prisma.asignacionCurso.findMany.mockResolvedValue([
      { id: "a-1", colaborador: { usuario: { id: "u-1" } } },
    ])
    m.prisma.notificacion.findFirst.mockResolvedValue({ id: "n-ya-emitida" })

    await cron.ejecutar()

    expect(m.notif.crear).not.toHaveBeenCalled()
  })

  it("error en una asignacion no aborta el loop — loggea warn y continua", async () => {
    m.prisma.curso.findMany.mockResolvedValueOnce([
      {
        id: "curso-1",
        titulo: "Curso uno",
        fechaDeadline: new Date("2026-05-20T10:00:00.000Z"),
      },
      {
        id: "curso-2",
        titulo: "Curso dos",
        fechaDeadline: new Date("2026-05-20T11:00:00.000Z"),
      },
    ])
    m.prisma.curso.findMany.mockResolvedValueOnce([])
    m.prisma.asignacionCurso.findMany
      .mockRejectedValueOnce(new Error("db hipo"))
      .mockResolvedValueOnce([{ id: "a-2", colaborador: { usuario: { id: "u-2" } } }])
    const warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined)

    await cron.ejecutar()

    expect(m.notif.crear).toHaveBeenCalledTimes(1)
    expect(m.notif.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "u-2",
        tipo: TipoEventoNotif.RECORDATORIO_DEADLINE,
      }),
    )
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("loguea resumen con cursos, emitidos, idempotentes y duracion", async () => {
    m.prisma.curso.findMany.mockResolvedValue([])
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined)
    await cron.ejecutar()
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(
        /recordatorio-deadline \| cursos=\d+ \| emitidos=\d+ \| idempotentes=\d+ \| duracionMs=\d+/,
      ),
    )
    logSpy.mockRestore()
  })
})
