import { Logger } from "@nestjs/common"
import { TipoEventoNotif } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { broadcastAdminsActivos, yaEmitidoHoy } from "./notificaciones.helpers"
import { NotificacionesService } from "./notificaciones.service"

interface PrismaMock {
  usuario: { findMany: ReturnType<typeof vi.fn> }
}

interface NotificacionesMock {
  crear: ReturnType<typeof vi.fn>
}

function buildMocks(): {
  prisma: PrismaMock
  notificaciones: NotificacionesMock
  logger: Logger
  warnSpy: ReturnType<typeof vi.fn>
} {
  const prisma: PrismaMock = { usuario: { findMany: vi.fn() } }
  const notificaciones: NotificacionesMock = {
    crear: vi.fn().mockResolvedValue({
      creada: true,
      notificacionId: "n",
      canalesEnviados: ["IN_APP"],
    }),
  }
  const warnSpy = vi.fn()
  const logger = { warn: warnSpy } as unknown as Logger
  return { prisma, notificaciones, logger, warnSpy }
}

const TIPO = TipoEventoNotif.COLABORADOR_LISTO
const PAYLOAD = {
  asignacionId: "a1",
  cursoId: "c1",
  cursoTitulo: "Curso X",
  colaboradorId: "co1",
  colaboradorNombre: "Ana",
} as const

describe("broadcastAdminsActivos", () => {
  let m: ReturnType<typeof buildMocks>

  beforeEach(() => {
    m = buildMocks()
  })

  it("emite una notificacion por cada admin activo encontrado", async () => {
    m.prisma.usuario.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }, { id: "u3" }])
    await broadcastAdminsActivos(
      m.prisma as unknown as PrismaService,
      m.notificaciones as unknown as NotificacionesService,
      m.logger,
      TIPO,
      { ...PAYLOAD },
    )
    expect(m.notificaciones.crear).toHaveBeenCalledTimes(3)
    expect(m.notificaciones.crear).toHaveBeenNthCalledWith(1, {
      usuarioId: "u1",
      tipo: TIPO,
      payload: { ...PAYLOAD },
    })
  })

  it("filtra por rol=ADMIN, bloqueado=false y excluye EX_EMPLEADO en el where", async () => {
    m.prisma.usuario.findMany.mockResolvedValue([])
    await broadcastAdminsActivos(
      m.prisma as unknown as PrismaService,
      m.notificaciones as unknown as NotificacionesService,
      m.logger,
      TIPO,
      { ...PAYLOAD },
    )
    const callArg = m.prisma.usuario.findMany.mock.calls[0]?.[0] as {
      where: {
        rol: string
        bloqueado: boolean
        colaborador: { estadoEmpleado: { not: string } }
      }
    }
    expect(callArg.where.rol).toBe("ADMIN")
    expect(callArg.where.bloqueado).toBe(false)
    expect(callArg.where.colaborador.estadoEmpleado.not).toBe("EX_EMPLEADO")
  })

  it("si 0 admins activos: logger.warn + NO invoca crear", async () => {
    m.prisma.usuario.findMany.mockResolvedValue([])
    await broadcastAdminsActivos(
      m.prisma as unknown as PrismaService,
      m.notificaciones as unknown as NotificacionesService,
      m.logger,
      TIPO,
      { ...PAYLOAD },
    )
    expect(m.notificaciones.crear).not.toHaveBeenCalled()
    expect(m.warnSpy).toHaveBeenCalledTimes(1)
    const mensaje = m.warnSpy.mock.calls[0]?.[0] as string
    expect(mensaje).toContain("no-admins-activos")
    expect(mensaje).toContain(TIPO)
  })

  it("si un admin individual falla: loggea warn pero continua con los demas", async () => {
    m.prisma.usuario.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }, { id: "u3" }])
    m.notificaciones.crear
      .mockResolvedValueOnce({ creada: true, notificacionId: "n1", canalesEnviados: [] })
      .mockRejectedValueOnce(new Error("resend down"))
      .mockResolvedValueOnce({ creada: true, notificacionId: "n3", canalesEnviados: [] })

    await broadcastAdminsActivos(
      m.prisma as unknown as PrismaService,
      m.notificaciones as unknown as NotificacionesService,
      m.logger,
      TIPO,
      { ...PAYLOAD },
    )
    expect(m.notificaciones.crear).toHaveBeenCalledTimes(3)
    expect(m.warnSpy).toHaveBeenCalledTimes(1)
    expect(m.warnSpy.mock.calls[0]?.[0]).toContain("admin=u2")
  })

  it("si findMany lanza: propaga el error al caller (infra)", async () => {
    m.prisma.usuario.findMany.mockRejectedValue(new Error("db down"))
    await expect(
      broadcastAdminsActivos(
        m.prisma as unknown as PrismaService,
        m.notificaciones as unknown as NotificacionesService,
        m.logger,
        TIPO,
        { ...PAYLOAD },
      ),
    ).rejects.toThrow("db down")
    expect(m.notificaciones.crear).not.toHaveBeenCalled()
  })
})

interface PrismaMockNotif {
  notificacion: { findFirst: ReturnType<typeof vi.fn> }
}

describe("yaEmitidoHoy", () => {
  let prismaNotif: PrismaMockNotif

  beforeEach(() => {
    prismaNotif = { notificacion: { findFirst: vi.fn() } }
  })

  it("con usuarioId: filtra por (tipoEvento, usuarioId, ventana del dia)", async () => {
    prismaNotif.notificacion.findFirst.mockResolvedValue(null)
    const hoy = new Date(Date.UTC(2026, 4, 13, 8, 30, 0))
    const resultado = await yaEmitidoHoy(
      prismaNotif as unknown as PrismaService,
      TipoEventoNotif.RECORDATORIO_DEADLINE,
      "user-1",
      hoy,
    )
    expect(resultado).toBe(false)
    const arg = prismaNotif.notificacion.findFirst.mock.calls[0]?.[0] as {
      where: {
        tipoEvento: string
        usuarioId: string
        fechaCreacion: { gte: Date; lt: Date }
      }
    }
    expect(arg.where.tipoEvento).toBe(TipoEventoNotif.RECORDATORIO_DEADLINE)
    expect(arg.where.usuarioId).toBe("user-1")
    expect(arg.where.fechaCreacion.gte.toISOString()).toBe("2026-05-13T00:00:00.000Z")
    expect(arg.where.fechaCreacion.lt.toISOString()).toBe("2026-05-14T00:00:00.000Z")
  })

  it("sin usuarioId (null): filtra solo por (tipoEvento, ventana del dia) — caso broadcast", async () => {
    prismaNotif.notificacion.findFirst.mockResolvedValue({ id: "n-existe" })
    const hoy = new Date(Date.UTC(2026, 4, 13, 8, 30, 0))
    const resultado = await yaEmitidoHoy(
      prismaNotif as unknown as PrismaService,
      TipoEventoNotif.CENTRO_REVISION,
      null,
      hoy,
    )
    expect(resultado).toBe(true)
    const arg = prismaNotif.notificacion.findFirst.mock.calls[0]?.[0] as {
      where: { tipoEvento: string; usuarioId?: string }
    }
    expect(arg.where.tipoEvento).toBe(TipoEventoNotif.CENTRO_REVISION)
    expect("usuarioId" in arg.where).toBe(false)
  })

  it("devuelve true cuando ya existe una fila del dia", async () => {
    prismaNotif.notificacion.findFirst.mockResolvedValue({ id: "n-existente" })
    const resultado = await yaEmitidoHoy(
      prismaNotif as unknown as PrismaService,
      TipoEventoNotif.RECORDATORIO_DEADLINE,
      "user-1",
      new Date(),
    )
    expect(resultado).toBe(true)
  })

  it("la ventana respeta el cambio de dia UTC (corte exacto a medianoche)", async () => {
    prismaNotif.notificacion.findFirst.mockResolvedValue(null)
    const finDeAnioUtc = new Date(Date.UTC(2026, 11, 31, 23, 59, 59))
    await yaEmitidoHoy(
      prismaNotif as unknown as PrismaService,
      TipoEventoNotif.RECORDATORIO_DEADLINE,
      "user-1",
      finDeAnioUtc,
    )
    const arg = prismaNotif.notificacion.findFirst.mock.calls[0]?.[0] as {
      where: { fechaCreacion: { gte: Date; lt: Date } }
    }
    expect(arg.where.fechaCreacion.gte.toISOString()).toBe("2026-12-31T00:00:00.000Z")
    expect(arg.where.fechaCreacion.lt.toISOString()).toBe("2027-01-01T00:00:00.000Z")
  })
})
