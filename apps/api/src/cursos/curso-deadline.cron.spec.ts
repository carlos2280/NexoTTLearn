import { Logger } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import { CursoDeadlineCron } from "./curso-deadline.cron"

interface PrismaMock {
  curso: { findMany: ReturnType<typeof vi.fn> }
  logCambioCurso: { findFirst: ReturnType<typeof vi.fn> }
  usuario: { findMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    curso: { findMany: vi.fn() },
    logCambioCurso: { findFirst: vi.fn() },
    usuario: { findMany: vi.fn() },
  }
}

describe("CursoDeadlineCron.ejecutar", () => {
  let prisma: PrismaMock
  let notif: { crear: ReturnType<typeof vi.fn> }
  let cron: CursoDeadlineCron

  beforeEach(() => {
    prisma = buildPrismaMock()
    notif = { crear: vi.fn().mockResolvedValue({ creada: true }) }
    cron = new CursoDeadlineCron(
      prisma as unknown as PrismaService,
      notif as unknown as NotificacionesService,
    )
  })

  it("emite CURSO_DEADLINE por cada curso con deadline=hoy usando el creador del log de publicacion", async () => {
    prisma.curso.findMany.mockResolvedValue([
      {
        id: "c1",
        titulo: "Curso A",
        fechaDeadline: new Date("2026-05-12T00:00:00.000Z"),
      },
    ])
    prisma.logCambioCurso.findFirst.mockResolvedValue({ autorUsuarioId: "u-admin-1" })

    await cron.ejecutar()

    expect(notif.crear).toHaveBeenCalledTimes(1)
    const llamada = notif.crear.mock.calls[0]?.[0] as {
      usuarioId: string
      tipo: string
      payload: { cursoId: string; cursoTitulo: string; fechaDeadline: string }
    }
    expect(llamada.usuarioId).toBe("u-admin-1")
    expect(llamada.tipo).toBe("CURSO_DEADLINE")
    expect(llamada.payload.cursoId).toBe("c1")
    expect(llamada.payload.cursoTitulo).toBe("Curso A")
  })

  it("hace broadcast a admins cuando no hay log de PUBLICACION del curso", async () => {
    prisma.curso.findMany.mockResolvedValue([
      {
        id: "c1",
        titulo: "Curso B",
        fechaDeadline: new Date("2026-05-12T00:00:00.000Z"),
      },
    ])
    prisma.logCambioCurso.findFirst.mockResolvedValue(null)
    prisma.usuario.findMany.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }])

    await cron.ejecutar()

    expect(notif.crear).toHaveBeenCalledTimes(2)
    const usuariosNotificados = notif.crear.mock.calls.map(
      (c: unknown[]) => (c[0] as { usuarioId: string }).usuarioId,
    )
    expect(usuariosNotificados.sort()).toEqual(["admin-1", "admin-2"])
  })

  it("no propaga errores de notificacion individual (best-effort)", async () => {
    prisma.curso.findMany.mockResolvedValue([
      {
        id: "c1",
        titulo: "Curso C",
        fechaDeadline: new Date("2026-05-12T00:00:00.000Z"),
      },
      {
        id: "c2",
        titulo: "Curso D",
        fechaDeadline: new Date("2026-05-12T00:00:00.000Z"),
      },
    ])
    prisma.logCambioCurso.findFirst.mockResolvedValue({ autorUsuarioId: "u-admin-1" })
    notif.crear.mockRejectedValueOnce(new Error("kaboom")).mockResolvedValueOnce({ creada: true })
    const warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {
      /* silencio durante el test */
    })

    await expect(cron.ejecutar()).resolves.toBeUndefined()
    expect(notif.crear).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("curso-deadline | fallo"))
    warnSpy.mockRestore()
  })

  it("no emite nada si no hay cursos con deadline=hoy", async () => {
    prisma.curso.findMany.mockResolvedValue([])
    await cron.ejecutar()
    expect(notif.crear).not.toHaveBeenCalled()
  })
})
