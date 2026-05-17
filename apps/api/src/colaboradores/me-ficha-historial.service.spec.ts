import { NotFoundException } from "@nestjs/common"
import { OrigenNotaSkill, RolAsignacion } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { MeFichaHistorialService } from "./me-ficha-historial.service"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  historicoNotaSkill: { findMany: ReturnType<typeof vi.fn> }
  asignacionCurso: { findMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    usuario: { findUnique: vi.fn() },
    historicoNotaSkill: { findMany: vi.fn().mockResolvedValue([]) },
    asignacionCurso: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

const COLAB = "11111111-1111-1111-1111-111111111111"
const USER = "33333333-3333-3333-3333-333333333333"
const AREA_BACK = { id: "area-back", nombre: "Backend" }
const SKILL_DJANGO = {
  id: "skill-django",
  etiquetaVisible: "Django REST",
  area: AREA_BACK,
}

describe("MeFichaHistorialService.obtenerHistorial", () => {
  let prisma: PrismaMock
  let service: MeFichaHistorialService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new MeFichaHistorialService(prisma as unknown as PrismaService)
  })

  it("vacio si el colaborador no tiene historial ni asignaciones", async () => {
    const out = await service.obtenerHistorial(COLAB, 50)
    expect(out).toEqual([])
  })

  it("mapea HistoricoNotaSkill a SKILL_DEMOSTRADA con nivel cualitativo derivado de la nota", async () => {
    prisma.historicoNotaSkill.findMany.mockResolvedValueOnce([
      {
        id: "hist-1",
        fecha: new Date("2026-05-14T10:00:00Z"),
        valor: 90,
        origen: OrigenNotaSkill.BLOQUE,
        referencia: null,
        notaSkill: { skill: SKILL_DJANGO },
      },
    ])

    const out = await service.obtenerHistorial(COLAB, 50)

    expect(out).toEqual([
      {
        tipo: "SKILL_DEMOSTRADA",
        id: "hist-1",
        fecha: "2026-05-14T10:00:00.000Z",
        skillId: "skill-django",
        skillNombre: "Django REST",
        areaId: AREA_BACK.id,
        areaNombre: "Backend",
        nivelCualitativo: "excelencia",
        origenNarrativo: "Bloque evaluable",
        origen: OrigenNotaSkill.BLOQUE,
      },
    ])
  })

  it("extrae referenciaIntentoIaId cuando origen es ENTREVISTA_IA y referencia lo tiene", async () => {
    prisma.historicoNotaSkill.findMany.mockResolvedValueOnce([
      {
        id: "hist-ia",
        fecha: new Date("2026-05-14T10:00:00Z"),
        valor: 75,
        origen: OrigenNotaSkill.ENTREVISTA_IA,
        referencia: { intentoEntrevistaIaId: "intento-9", evento: "FINALIZADO" },
        notaSkill: { skill: SKILL_DJANGO },
      },
    ])

    const [evento] = await service.obtenerHistorial(COLAB, 50)

    expect(evento).toMatchObject({
      tipo: "SKILL_DEMOSTRADA",
      origen: OrigenNotaSkill.ENTREVISTA_IA,
      origenNarrativo: "Entrevista IA",
      nivelCualitativo: "solido",
      referenciaIntentoIaId: "intento-9",
    })
  })

  it("emite CURSO_INICIADO siempre y CURSO_COMPLETADO solo cuando hay cierre visible", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      {
        id: "asig-1",
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: "APTO",
        estadoVoluntario: null,
        createdAt: new Date("2026-04-01T08:00:00Z"),
        fechaCierre: new Date("2026-05-12T18:00:00Z"),
        curso: { id: "curso-1", titulo: "Java Senior" },
      },
      {
        id: "asig-2",
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: "EN_PROGRESO",
        estadoVoluntario: null,
        createdAt: new Date("2026-05-10T08:00:00Z"),
        fechaCierre: null,
        curso: { id: "curso-2", titulo: "Spring Boot" },
      },
    ])

    const out = await service.obtenerHistorial(COLAB, 50)

    expect(out.map((e) => `${e.tipo}-${"cursoTitulo" in e ? e.cursoTitulo : ""}`)).toEqual([
      "CURSO_COMPLETADO-Java Senior",
      "CURSO_INICIADO-Spring Boot",
      "CURSO_INICIADO-Java Senior",
    ])
  })

  it("ordena por fecha DESC mezclando skills e hitos de curso", async () => {
    prisma.historicoNotaSkill.findMany.mockResolvedValueOnce([
      {
        id: "hist-old",
        fecha: new Date("2026-04-10T10:00:00Z"),
        valor: 60,
        origen: OrigenNotaSkill.BLOQUE,
        referencia: null,
        notaSkill: { skill: SKILL_DJANGO },
      },
    ])
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      {
        id: "asig-1",
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: "EN_PROGRESO",
        estadoVoluntario: null,
        createdAt: new Date("2026-04-15T08:00:00Z"),
        fechaCierre: null,
        curso: { id: "curso-1", titulo: "Java" },
      },
    ])

    const out = await service.obtenerHistorial(COLAB, 50)

    expect(out[0]?.tipo).toBe("CURSO_INICIADO")
    expect(out[1]?.tipo).toBe("SKILL_DEMOSTRADA")
  })

  it("respeta el limite y corta el array final", async () => {
    const hoy = new Date("2026-05-14T10:00:00Z")
    prisma.historicoNotaSkill.findMany.mockResolvedValueOnce(
      Array.from({ length: 10 }, (_, i) => ({
        id: `h-${i}`,
        fecha: new Date(hoy.getTime() - i * 86400_000),
        valor: 80,
        origen: OrigenNotaSkill.BLOQUE,
        referencia: null,
        notaSkill: { skill: SKILL_DJANGO },
      })),
    )

    const out = await service.obtenerHistorial(COLAB, 3)
    expect(out).toHaveLength(3)
  })
})

describe("MeFichaHistorialService.obtenerHistorialDeUsuario", () => {
  let prisma: PrismaMock
  let service: MeFichaHistorialService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new MeFichaHistorialService(prisma as unknown as PrismaService)
  })

  it("404 si el usuario no tiene colaborador asociado", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerHistorialDeUsuario(USER, 50)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("resuelve colaboradorId desde el usuario", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    const out = await service.obtenerHistorialDeUsuario(USER, 50)
    expect(out).toEqual([])
    expect(prisma.historicoNotaSkill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          notaSkill: { colaboradorId: COLAB },
        }),
      }),
    )
  })
})
