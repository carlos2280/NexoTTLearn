import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import { MeAvanceService } from "./me-avance.service"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { findUnique: ReturnType<typeof vi.fn> }
  curso: { findUnique: ReturnType<typeof vi.fn> }
  cursoFotografiaCierre: { findUnique: ReturnType<typeof vi.fn> }
  cursoSkillExigida: { findMany: ReturnType<typeof vi.fn> }
  notaSkill: { findMany: ReturnType<typeof vi.fn> }
  planEstudio: { findUnique: ReturnType<typeof vi.fn> }
  itemPlan: {
    count: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
  aperturaSeccion: {
    count: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return {
    usuario: { findUnique: vi.fn() },
    asignacionCurso: { findUnique: vi.fn() },
    curso: { findUnique: vi.fn().mockResolvedValue({ umbralNoCumple: 10 }) },
    cursoFotografiaCierre: { findUnique: vi.fn() },
    cursoSkillExigida: { findMany: vi.fn().mockResolvedValue([]) },
    notaSkill: { findMany: vi.fn().mockResolvedValue([]) },
    planEstudio: { findUnique: vi.fn().mockResolvedValue(null) },
    itemPlan: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    aperturaSeccion: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
  }
}

interface PlanServiceMock {
  obtenerPorcentajeAvance: ReturnType<typeof vi.fn>
}

function buildPlanMock(): PlanServiceMock {
  return { obtenerPorcentajeAvance: vi.fn().mockResolvedValue(45) }
}

const COLAB = "11111111-1111-1111-1111-111111111111"
const CURSO = "22222222-2222-2222-2222-222222222222"
const USER = "33333333-3333-3333-3333-333333333333"
const ASIG = "44444444-4444-4444-4444-444444444444"

describe("MeAvanceService.obtenerAvance", () => {
  let prisma: PrismaMock
  let plan: PlanServiceMock
  let service: MeAvanceService

  beforeEach(() => {
    prisma = buildPrismaMock()
    plan = buildPlanMock()
    service = new MeAvanceService(
      prisma as unknown as PrismaService,
      plan as unknown as PlanPersonalService,
    )
  })

  it("404 asignacionNoEncontrada si no hay asignacion", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerAvance(COLAB, CURSO)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("curso ACTIVO: NO incluye notaGlobalFinal ni etiquetaCualitativaFinal", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      curso: { id: CURSO, estado: "ACTIVO" },
    })

    const response = await service.obtenerAvance(COLAB, CURSO)

    expect(response.estaCerrado).toBe(false)
    expect(response.porcentajeAvance).toBe(45)
    expect("notaGlobalFinal" in response).toBe(false)
    expect("etiquetaCualitativaFinal" in response).toBe(false)
  })

  it("curso CERRADO con fotografia: INCLUYE notaGlobalFinal + etiqueta", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      curso: { id: CURSO, estado: "CERRADO" },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      snapshot: {
        versionSnapshot: 1,
        asignaciones: [{ asignacionId: ASIG, notaGlobalFinal: 87 }],
      },
    })

    const response = await service.obtenerAvance(COLAB, CURSO)

    expect(response.estaCerrado).toBe(true)
    expect(response.notaGlobalFinal).toBe(87)
    expect(response.etiquetaCualitativaFinal).toBe("excelencia")
  })

  it("curso CERRADO sin fotografia: estaCerrado=true pero SIN nota final", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      curso: { id: CURSO, estado: "CERRADO" },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce(null)

    const response = await service.obtenerAvance(COLAB, CURSO)
    expect(response.estaCerrado).toBe(true)
    expect("notaGlobalFinal" in response).toBe(false)
  })

  it("clasifica nota final 70 como solido", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      curso: { id: CURSO, estado: "CERRADO" },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      snapshot: {
        versionSnapshot: 1,
        asignaciones: [{ asignacionId: ASIG, notaGlobalFinal: 70 }],
      },
    })
    const r = await service.obtenerAvance(COLAB, CURSO)
    expect(r.etiquetaCualitativaFinal).toBe("solido")
  })
})

describe("MeAvanceService.caminoHaciaApto (B-4)", () => {
  let prisma: PrismaMock
  let plan: PlanServiceMock
  let service: MeAvanceService

  beforeEach(() => {
    prisma = buildPrismaMock()
    plan = buildPlanMock()
    service = new MeAvanceService(
      prisma as unknown as PrismaService,
      plan as unknown as PlanPersonalService,
    )
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIG,
      curso: { id: CURSO, estado: "ACTIVO" },
    })
  })

  it("sin skills exigidas: faltantesParaApto=0, estaListo=true, porArea vacio", async () => {
    const response = await service.obtenerAvance(COLAB, CURSO)
    expect(response.caminoHaciaApto).toEqual({
      faltantesParaApto: 0,
      estaListo: true,
      porArea: [],
    })
  })

  it("agrupa por area, clasifica nivel cualitativo y ordena alfabetico", async () => {
    const areaBackend = { id: "area-back", codigo: "backend", nombre: "Backend" }
    const areaCloud = { id: "area-cloud", codigo: "cloud", nombre: "Cloud" }
    const areaData = { id: "area-data", codigo: "data", nombre: "Data" }
    prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([
      // Backend: 3 exigidas, 2 demostradas (>= notaMinima) -> enDesarrollo.
      {
        skillId: "sk-b1",
        notaMinima: 70,
        skill: { id: "sk-b1", etiquetaVisible: "java", area: areaBackend },
      },
      {
        skillId: "sk-b2",
        notaMinima: 70,
        skill: { id: "sk-b2", etiquetaVisible: "spring", area: areaBackend },
      },
      {
        skillId: "sk-b3",
        notaMinima: 70,
        skill: { id: "sk-b3", etiquetaVisible: "rest", area: areaBackend },
      },
      // Cloud: 2 exigidas, 2 demostradas -> solido.
      {
        skillId: "sk-c1",
        notaMinima: 60,
        skill: { id: "sk-c1", etiquetaVisible: "aws", area: areaCloud },
      },
      {
        skillId: "sk-c2",
        notaMinima: 60,
        skill: { id: "sk-c2", etiquetaVisible: "docker", area: areaCloud },
      },
      // Data: 2 exigidas, 0 demostradas -> porExplorar.
      {
        skillId: "sk-d1",
        notaMinima: 50,
        skill: { id: "sk-d1", etiquetaVisible: "sql", area: areaData },
      },
      {
        skillId: "sk-d2",
        notaMinima: 50,
        skill: { id: "sk-d2", etiquetaVisible: "etl", area: areaData },
      },
    ])
    prisma.notaSkill.findMany.mockResolvedValueOnce([
      { skillId: "sk-b1", notaActual: 85 }, // cumple
      { skillId: "sk-b2", notaActual: 70 }, // cumple (igual al minimo)
      { skillId: "sk-b3", notaActual: 40 }, // no cumple
      { skillId: "sk-c1", notaActual: 90 }, // cumple
      { skillId: "sk-c2", notaActual: 60 }, // cumple
      { skillId: "sk-d1", notaActual: 30 }, // no cumple
      // sk-d2 sin nota -> no cumple.
    ])

    const response = await service.obtenerAvance(COLAB, CURSO)

    expect(response.caminoHaciaApto.faltantesParaApto).toBe(3) // 1 + 0 + 2
    expect(response.caminoHaciaApto.estaListo).toBe(false)
    expect(response.caminoHaciaApto.porArea.map((a) => a.areaNombre)).toEqual([
      "Backend",
      "Cloud",
      "Data",
    ])
    expect(response.caminoHaciaApto.porArea[0]).toMatchObject({
      areaCodigo: "backend",
      skillsExigidas: 3,
      skillsDemostradas: 2,
      nivelCualitativo: "enDesarrollo",
    })
    expect(response.caminoHaciaApto.porArea[1]).toMatchObject({
      areaCodigo: "cloud",
      skillsExigidas: 2,
      skillsDemostradas: 2,
      nivelCualitativo: "solido",
    })
    expect(response.caminoHaciaApto.porArea[2]).toMatchObject({
      areaCodigo: "data",
      skillsExigidas: 2,
      skillsDemostradas: 0,
      nivelCualitativo: "porExplorar",
    })
  })

  it("todas demostradas: estaListo=true y nivel solido en todas las areas", async () => {
    const area = { id: "area-x", codigo: "x", nombre: "X" }
    prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([
      { skillId: "s1", notaMinima: 50, skill: { id: "s1", etiquetaVisible: "a", area } },
      { skillId: "s2", notaMinima: 50, skill: { id: "s2", etiquetaVisible: "b", area } },
    ])
    prisma.notaSkill.findMany.mockResolvedValueOnce([
      { skillId: "s1", notaActual: 80 },
      { skillId: "s2", notaActual: 50 },
    ])

    const response = await service.obtenerAvance(COLAB, CURSO)

    expect(response.caminoHaciaApto.faltantesParaApto).toBe(0)
    expect(response.caminoHaciaApto.estaListo).toBe(true)
    expect(response.caminoHaciaApto.porArea[0]?.nivelCualitativo).toBe("solido")
  })
})

describe("MeAvanceService.obtenerAvanceDeUsuario", () => {
  let prisma: PrismaMock
  let plan: PlanServiceMock
  let service: MeAvanceService

  beforeEach(() => {
    prisma = buildPrismaMock()
    plan = buildPlanMock()
    service = new MeAvanceService(
      prisma as unknown as PrismaService,
      plan as unknown as PlanPersonalService,
    )
  })

  it("404 si el usuario no tiene colaborador", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerAvanceDeUsuario(USER, CURSO)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("resuelve colaboradorId desde el usuario", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      curso: { id: CURSO, estado: "ACTIVO" },
    })

    const response = await service.obtenerAvanceDeUsuario(USER, CURSO)
    expect(response.cursoId).toBe(CURSO)
    expect(prisma.asignacionCurso.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          // biome-ignore lint/style/useNamingConvention: clave compuesta Prisma.
          colaboradorId_cursoId: { colaboradorId: COLAB, cursoId: CURSO },
        }),
      }),
    )
  })
})
