import { NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { MeFichaResumenService } from "./me-ficha-resumen.service"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  notaSkill: { findMany: ReturnType<typeof vi.fn> }
  historicoNotaSkill: { findFirst: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    usuario: { findUnique: vi.fn() },
    notaSkill: { findMany: vi.fn().mockResolvedValue([]) },
    historicoNotaSkill: { findFirst: vi.fn().mockResolvedValue(null) },
  }
}

const USER = "11111111-1111-1111-1111-111111111111"
const COLAB = "22222222-2222-2222-2222-222222222222"
const AREA_BE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
const AREA_FE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"
const AREA_CLOUD = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"
const AREA_DATA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"

function notaRow(opts: {
  nota: number
  areaId: string
  areaCodigo: string
  areaNombre: string
}): unknown {
  return {
    notaActual: new Prisma.Decimal(opts.nota),
    skill: {
      area: { id: opts.areaId, codigo: opts.areaCodigo, nombre: opts.areaNombre },
    },
  }
}

describe("MeFichaResumenService.obtenerResumen", () => {
  let prisma: PrismaMock
  let service: MeFichaResumenService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new MeFichaResumenService(prisma as unknown as PrismaService)
  })

  it("404 si el usuario no tiene colaborador asociado", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerResumen(USER)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("sin actividad: totalAreasConActividad=0, topAreas=[], ultimaSkillDemostrada=null", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })

    const out = await service.obtenerResumen(USER)

    expect(out).toEqual({
      totalAreasConActividad: 0,
      topAreas: [],
      ultimaSkillDemostrada: null,
    })
  })

  it("clasifica promedios: >=70 solido, >=50 enDesarrollo, <50 inicial", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.notaSkill.findMany.mockResolvedValueOnce([
      // Backend: 80 + 70 = promedio 75 → solido
      notaRow({ nota: 80, areaId: AREA_BE, areaCodigo: "backend", areaNombre: "Backend" }),
      notaRow({ nota: 70, areaId: AREA_BE, areaCodigo: "backend", areaNombre: "Backend" }),
      // Frontend: 60 → enDesarrollo
      notaRow({ nota: 60, areaId: AREA_FE, areaCodigo: "frontend", areaNombre: "Frontend" }),
      // Data: 40 → inicial
      notaRow({ nota: 40, areaId: AREA_DATA, areaCodigo: "data", areaNombre: "Data" }),
    ])

    const out = await service.obtenerResumen(USER)

    expect(out.totalAreasConActividad).toBe(3)
    const areaBe = out.topAreas.find((a) => a.areaId === AREA_BE)
    const areaFe = out.topAreas.find((a) => a.areaId === AREA_FE)
    const areaData = out.topAreas.find((a) => a.areaId === AREA_DATA)
    expect(areaBe?.nivelCualitativo).toBe("solido")
    expect(areaFe?.nivelCualitativo).toBe("enDesarrollo")
    expect(areaData?.nivelCualitativo).toBe("inicial")
  })

  it("ordena por nivel desc (solido>enDesarrollo>inicial) y desempata alfabetico", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.notaSkill.findMany.mockResolvedValueOnce([
      // Frontend solido (75)
      notaRow({ nota: 75, areaId: AREA_FE, areaCodigo: "frontend", areaNombre: "Frontend" }),
      // Cloud solido (80) — alfabeticamente antes que Frontend → Cloud primero
      notaRow({ nota: 80, areaId: AREA_CLOUD, areaCodigo: "cloud", areaNombre: "Cloud" }),
      // Backend solido (90) — alfabeticamente el primero
      notaRow({ nota: 90, areaId: AREA_BE, areaCodigo: "backend", areaNombre: "Backend" }),
      // Data enDesarrollo (55)
      notaRow({ nota: 55, areaId: AREA_DATA, areaCodigo: "data", areaNombre: "Data" }),
    ])

    const out = await service.obtenerResumen(USER)

    expect(out.topAreas.map((a) => a.areaNombre)).toEqual(["Backend", "Cloud", "Frontend"])
    // Data (enDesarrollo) cae fuera del top 3.
  })

  it("limita a 3 areas en topAreas", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.notaSkill.findMany.mockResolvedValueOnce([
      notaRow({ nota: 80, areaId: AREA_BE, areaCodigo: "backend", areaNombre: "Backend" }),
      notaRow({ nota: 75, areaId: AREA_FE, areaCodigo: "frontend", areaNombre: "Frontend" }),
      notaRow({ nota: 78, areaId: AREA_CLOUD, areaCodigo: "cloud", areaNombre: "Cloud" }),
      notaRow({ nota: 72, areaId: AREA_DATA, areaCodigo: "data", areaNombre: "Data" }),
    ])

    const out = await service.obtenerResumen(USER)

    expect(out.totalAreasConActividad).toBe(4)
    expect(out.topAreas).toHaveLength(3)
  })

  it("ultimaSkillDemostrada se toma del historico ordenado DESC", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.historicoNotaSkill.findFirst.mockResolvedValueOnce({
      fecha: new Date("2026-05-14T10:30:00.000Z"),
      notaSkill: { skill: { etiquetaVisible: "Spring Boot" } },
    })

    const out = await service.obtenerResumen(USER)

    expect(out.ultimaSkillDemostrada).toEqual({
      skillNombre: "Spring Boot",
      fecha: "2026-05-14T10:30:00.000Z",
    })
  })
})
