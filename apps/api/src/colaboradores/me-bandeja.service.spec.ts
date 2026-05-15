import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import { MeBandejaService } from "./me-bandeja.service"

vi.mock("../asignaciones/asignaciones.helpers", () => ({
  evaluarCondicionesListo: vi.fn(),
}))

import { evaluarCondicionesListo } from "../asignaciones/asignaciones.helpers"

const evaluarMock = vi.mocked(evaluarCondicionesListo)

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { findMany: ReturnType<typeof vi.fn> }
  notificacion: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  curso: { count: ReturnType<typeof vi.fn> }
  historicoEstadoAsignacion: { findMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    usuario: { findUnique: vi.fn() },
    asignacionCurso: { findMany: vi.fn().mockResolvedValue([]) },
    notificacion: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    curso: { count: vi.fn().mockResolvedValue(0) },
    historicoEstadoAsignacion: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

function buildPlanMock(porcentaje = 33): { obtenerPorcentajeAvance: ReturnType<typeof vi.fn> } {
  return { obtenerPorcentajeAvance: vi.fn().mockResolvedValue(porcentaje) }
}

const USER = "11111111-1111-1111-1111-111111111111"
const COLAB = "22222222-2222-2222-2222-222222222222"
const ASIG_1 = "33333333-3333-3333-3333-333333333333"
const ASIG_2 = "44444444-4444-4444-4444-444444444444"
const CURSO_1 = "55555555-5555-5555-5555-555555555555"
const CURSO_2 = "66666666-6666-6666-6666-666666666666"
const TRANSVERSAL = "77777777-7777-7777-7777-777777777777"
const ENTREVISTA = "88888888-8888-8888-8888-888888888888"

interface AsigOpts {
  id?: string
  cursoId?: string
  cursoTitulo?: string
  rol?: "ASIGNADO" | "VOLUNTARIO"
  estadoAsignado?: "ASIGNADO" | "EN_PROGRESO" | "LISTO" | "APTO" | "NO_APTO" | "RETIRADO" | null
  estadoVoluntario?: "INSCRITO" | "EN_PROGRESO" | "LISTO" | "COMPLETADO" | "RETIRADO" | null
  fechaDeadline?: string
  createdAt?: string
  fechaCierre?: string | null
  cursoEstado?: "ACTIVO" | "CERRADO"
  transversalId?: string | null
  entrevistaIaId?: string | null
}

function asignacionRow(opts: AsigOpts = {}): Record<string, unknown> {
  const rol = opts.rol ?? "ASIGNADO"
  return {
    id: opts.id ?? ASIG_1,
    rol,
    estadoAsignado: opts.estadoAsignado ?? (rol === "ASIGNADO" ? "EN_PROGRESO" : null),
    estadoVoluntario: opts.estadoVoluntario ?? (rol === "VOLUNTARIO" ? "EN_PROGRESO" : null),
    fechaCierre:
      opts.fechaCierre === undefined ? null : opts.fechaCierre ? new Date(opts.fechaCierre) : null,
    createdAt: new Date(opts.createdAt ?? "2026-04-01T10:00:00Z"),
    curso: {
      id: opts.cursoId ?? CURSO_1,
      titulo: opts.cursoTitulo ?? "Curso demo",
      estado: opts.cursoEstado ?? "ACTIVO",
      fechaDeadline: new Date(opts.fechaDeadline ?? "2026-09-30T00:00:00Z"),
      transversalId: opts.transversalId ?? null,
      entrevistaIaId: opts.entrevistaIaId ?? null,
    },
  }
}

describe("MeBandejaService.obtenerBandeja", () => {
  let prisma: PrismaMock
  let plan: ReturnType<typeof buildPlanMock>
  let service: MeBandejaService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-14T10:00:00Z"))
    evaluarMock.mockReset()
    evaluarMock.mockResolvedValue({
      cumple: false,
      planCompleto: false,
      transversal: "NO_APLICA",
      entrevistaIA: "NO_APLICA",
      faltantes: [],
    })
    prisma = buildPrismaMock()
    plan = buildPlanMock()
    service = new MeBandejaService(
      prisma as unknown as PrismaService,
      plan as unknown as PlanPersonalService,
    )
  })

  it("404 si el usuario no tiene colaborador asociado", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerBandeja(USER)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("empty state: sin cursos ni voluntariado disponible devuelve siguienteAccion=null", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion).toBeNull()
    expect(out.pendientes).toHaveLength(0)
    expect(out.contadores.cursosActivos).toBe(0)
  })

  it("EXPLORAR_VOLUNTARIADO cuando no hay cursos activos pero si voluntariado", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.curso.count.mockResolvedValueOnce(3)
    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion).toEqual({
      tipo: "EXPLORAR_VOLUNTARIADO",
      totalCursosAbiertos: 3,
    })
  })

  it("CONTINUAR_CURSO cuando hay un curso ASIGNADO en progreso sin urgencias", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany
      .mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1, fechaDeadline: "2026-12-01T00:00:00Z" }),
      ])
      .mockResolvedValueOnce([])
    plan.obtenerPorcentajeAvance.mockResolvedValue(50)

    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion).toMatchObject({
      tipo: "CONTINUAR_CURSO",
      asignacionId: ASIG_1,
      porcentajeAvance: 50,
    })
    expect(out.pendientes).toHaveLength(1)
    expect(out.pendientes[0]?.tonoDeadline).toBe("lejos")
  })

  it("DEADLINE_CRITICO gana sobre CONTINUAR_CURSO si avance<80 y deadline<=7d", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany
      .mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1, fechaDeadline: "2026-05-18T00:00:00Z" }),
        asignacionRow({ id: ASIG_2, cursoId: CURSO_2, fechaDeadline: "2026-12-01T00:00:00Z" }),
      ])
      .mockResolvedValueOnce([])
    plan.obtenerPorcentajeAvance.mockResolvedValueOnce(40).mockResolvedValueOnce(70)

    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion?.tipo).toBe("DEADLINE_CRITICO")
    if (out.siguienteAccion?.tipo === "DEADLINE_CRITICO") {
      expect(out.siguienteAccion.asignacionId).toBe(ASIG_1)
      expect(out.siguienteAccion.diasRestantes).toBeLessThanOrEqual(7)
    }
  })

  it("ASIGNACION_NUEVA cuando hay asignacion <48h sin entrar (estado ASIGNADO)", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany
      .mockResolvedValueOnce([
        asignacionRow({
          id: ASIG_1,
          cursoId: CURSO_1,
          estadoAsignado: "ASIGNADO",
          createdAt: "2026-05-13T12:00:00Z", // 22h antes del ahora del test
          fechaDeadline: "2026-12-01T00:00:00Z",
        }),
      ])
      .mockResolvedValueOnce([])
    plan.obtenerPorcentajeAvance.mockResolvedValue(0)

    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion?.tipo).toBe("ASIGNACION_NUEVA")
  })

  it("TRANSVERSAL_DISPONIBLE cuando plan completo y transversal NO_APROBADO", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany
      .mockResolvedValueOnce([
        asignacionRow({
          id: ASIG_1,
          cursoId: CURSO_1,
          transversalId: TRANSVERSAL,
          fechaDeadline: "2026-12-01T00:00:00Z",
        }),
      ])
      .mockResolvedValueOnce([])
    plan.obtenerPorcentajeAvance.mockResolvedValue(100)
    evaluarMock.mockResolvedValueOnce({
      cumple: false,
      planCompleto: true,
      transversal: "NO_APROBADO",
      entrevistaIA: "NO_APLICA",
      faltantes: [],
    })

    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion?.tipo).toBe("TRANSVERSAL_DISPONIBLE")
  })

  it("ENTREVISTA_IA_DISPONIBLE cuando plan completo + transversal aprobado + entrevista no aprobada", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany
      .mockResolvedValueOnce([
        asignacionRow({
          id: ASIG_1,
          cursoId: CURSO_1,
          transversalId: TRANSVERSAL,
          entrevistaIaId: ENTREVISTA,
          fechaDeadline: "2026-12-01T00:00:00Z",
        }),
      ])
      .mockResolvedValueOnce([])
    plan.obtenerPorcentajeAvance.mockResolvedValue(100)
    evaluarMock.mockResolvedValueOnce({
      cumple: false,
      planCompleto: true,
      transversal: "APROBADO",
      entrevistaIA: "NO_APROBADO",
      faltantes: [],
    })

    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion?.tipo).toBe("ENTREVISTA_IA_DISPONIBLE")
  })

  it("CASO_REABIERTO gana sobre el resto si hay reapertura reciente", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany
      .mockResolvedValueOnce([
        asignacionRow({ id: ASIG_1, cursoId: CURSO_1, fechaDeadline: "2026-05-18T00:00:00Z" }),
      ])
      .mockResolvedValueOnce([])
    plan.obtenerPorcentajeAvance.mockResolvedValue(40)
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValueOnce([
      {
        fecha: new Date("2026-05-13T10:00:00Z"),
        motivo: "Cliente pidio revision",
        asignacion: {
          id: ASIG_1,
          curso: { id: CURSO_1, titulo: "Curso demo", estado: "ACTIVO" },
        },
      },
    ])

    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion?.tipo).toBe("CASO_REABIERTO")
    if (out.siguienteAccion?.tipo === "CASO_REABIERTO") {
      expect(out.siguienteAccion.motivo).toBe("Cliente pidio revision")
    }
  })

  it("RESULTADO_CIERRE_LISTO cuando hay cierre APTO/NO_APTO/COMPLETADO reciente", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      asignacionRow({
        id: ASIG_1,
        cursoId: CURSO_1,
        cursoEstado: "CERRADO",
        estadoAsignado: "APTO",
        fechaCierre: "2026-05-12T10:00:00Z",
      }),
    ])

    const out = await service.obtenerBandeja(USER)
    expect(out.siguienteAccion).toMatchObject({
      tipo: "RESULTADO_CIERRE_LISTO",
      resultado: "APTO",
    })
  })

  it("pendientes: VOLUNTARIO queda despues de ASIGNADO en el listado", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findMany
      .mockResolvedValueOnce([
        asignacionRow({
          id: ASIG_1,
          cursoId: CURSO_1,
          rol: "VOLUNTARIO",
          fechaDeadline: "2026-09-01T00:00:00Z",
        }),
        asignacionRow({
          id: ASIG_2,
          cursoId: CURSO_2,
          rol: "ASIGNADO",
          fechaDeadline: "2026-12-01T00:00:00Z",
        }),
      ])
      .mockResolvedValueOnce([])
    plan.obtenerPorcentajeAvance.mockResolvedValueOnce(50)

    const out = await service.obtenerBandeja(USER)
    expect(out.pendientes[0]?.rol).toBe("ASIGNADO")
    expect(out.pendientes[1]?.rol).toBe("VOLUNTARIO")
    expect(out.pendientes[1]?.porcentajeAvance).toBe(0)
  })

  it("contadores: pasa novedades y voluntariado al envelope", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.notificacion.count.mockResolvedValueOnce(7)
    prisma.curso.count.mockResolvedValueOnce(4)
    prisma.notificacion.findMany.mockResolvedValueOnce([
      {
        id: "n1",
        tipoEvento: "ASIGNACION_CURSO",
        esCritico: true,
        fechaCreacion: new Date("2026-05-13T10:00:00Z"),
        leida: false,
        fechaLeida: null,
        archivada: false,
      },
    ])

    const out = await service.obtenerBandeja(USER)
    expect(out.contadores).toEqual({
      notificacionesNoLeidas: 7,
      cursosVoluntariadoAbiertos: 4,
      cursosActivos: 0,
    })
    expect(out.novedades).toHaveLength(1)
    expect(out.novedades[0]?.tipoEvento).toBe("ASIGNACION_CURSO")
  })
})
