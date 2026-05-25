import { NotFoundException } from "@nestjs/common"
import { RolAsignacion } from "@prisma/client"
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
  cursoModuloHabilitado: { findMany: ReturnType<typeof vi.fn> }
  intentoBloque: { findMany: ReturnType<typeof vi.fn> }
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
  seccion: {
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
    cursoModuloHabilitado: { findMany: vi.fn().mockResolvedValue([]) },
    intentoBloque: { findMany: vi.fn().mockResolvedValue([]) },
    notaSkill: { findMany: vi.fn().mockResolvedValue([]) },
    planEstudio: { findUnique: vi.fn().mockResolvedValue(null) },
    itemPlan: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    aperturaSeccion: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    seccion: {
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
      rol: RolAsignacion.ASIGNADO,
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
      rol: RolAsignacion.ASIGNADO,
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
      rol: RolAsignacion.ASIGNADO,
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
      rol: RolAsignacion.ASIGNADO,
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

  // BUG-QA-2: snapshots construidos antes de DEUDA-B26-1 no persisten
  // `notaGlobalFinal`. El endpoint debe caer al promedio de notas (igual que
  // /me/cursos/:id/resumen-cierre) en lugar de devolver el cierre sin nota.
  it("snapshot legacy SIN notaGlobalFinal: aplica fallback promedio (BUG-QA-2)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      rol: RolAsignacion.ASIGNADO,
      curso: { id: CURSO, estado: "CERRADO" },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      snapshot: {
        versionSnapshot: 1,
        asignaciones: [
          {
            asignacionId: ASIG,
            // sin notaGlobalFinal
            notasPorSkill: [
              { skillId: "s1", notaActual: 90, umbralCumple: 70 },
              { skillId: "s2", notaActual: 70, umbralCumple: 70 },
            ],
          },
        ],
      },
    })

    const response = await service.obtenerAvance(COLAB, CURSO)

    expect(response.estaCerrado).toBe(true)
    expect(response.notaGlobalFinal).toBe(80) // (90 + 70) / 2
    expect(response.etiquetaCualitativaFinal).toBe("solido")
  })

  it("snapshot legacy con caracter: el fallback solo promedia OBLIGATORIAS", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      rol: RolAsignacion.ASIGNADO,
      curso: { id: CURSO, estado: "CERRADO" },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      snapshot: {
        versionSnapshot: 1,
        asignaciones: [
          {
            asignacionId: ASIG,
            notasPorSkill: [
              { skillId: "s1", notaActual: 80, umbralCumple: 70, caracter: "OBLIGATORIA" },
              { skillId: "s2", notaActual: 60, umbralCumple: 70, caracter: "OBLIGATORIA" },
              // OPCIONAL con nota alta: NO debe inflar el promedio.
              { skillId: "s3", notaActual: 100, umbralCumple: 70, caracter: "OPCIONAL" },
            ],
          },
        ],
      },
    })

    const response = await service.obtenerAvance(COLAB, CURSO)
    expect(response.notaGlobalFinal).toBe(70) // (80 + 60) / 2 — OPCIONAL excluida
  })

  it("snapshot legacy sin notas no nulas: OMITE notaGlobalFinal en el response", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      rol: RolAsignacion.ASIGNADO,
      curso: { id: CURSO, estado: "CERRADO" },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      snapshot: {
        versionSnapshot: 1,
        asignaciones: [
          {
            asignacionId: ASIG,
            notasPorSkill: [{ skillId: "s1", notaActual: null, umbralCumple: 70 }],
          },
        ],
      },
    })

    const response = await service.obtenerAvance(COLAB, CURSO)

    expect(response.estaCerrado).toBe(true)
    // Sin nota inferible -> el response omite ambos campos en lugar de mentir
    // con 0 / noCumple (la version /resumen-cierre sí elige 0 por contrato
    // de ceremonia; aquí la UX es la vista activa, mejor no inventar).
    expect("notaGlobalFinal" in response).toBe(false)
    expect("etiquetaCualitativaFinal" in response).toBe(false)
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
      rol: RolAsignacion.ASIGNADO,
      curso: { id: CURSO, estado: "ACTIVO" },
    })
  })

  it("sin skills exigidas: catalogoIncompleto=true, estaListo=false (evita falso SOLIDO)", async () => {
    const response = await service.obtenerAvance(COLAB, CURSO)
    expect(response.caminoHaciaApto).toEqual({
      faltantesParaApto: 0,
      estaListo: false,
      porArea: [],
      catalogoIncompleto: true,
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

describe("MeAvanceService.obtenerAvance — rol VOLUNTARIO (BUG-VOL-1)", () => {
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
      rol: RolAsignacion.VOLUNTARIO,
      curso: { id: CURSO, estado: "ACTIVO" },
    })
  })

  it("voluntario sin plan: seccionesObligatorias = total del curso, porcentaje real", async () => {
    // El voluntario abrio 2 de 8 secciones del catalogo. Sin plan, antes el
    // backend devolvia "2 de 0 secciones, 0%" (matematicamente imposible).
    prisma.aperturaSeccion.findMany.mockResolvedValueOnce([
      { seccionId: "sec-a" },
      { seccionId: "sec-b" },
    ])
    prisma.seccion.count.mockResolvedValueOnce(8)
    prisma.seccion.findMany.mockResolvedValueOnce([
      { id: "sec-a", titulo: "A", orden: 1, moduloId: "m1", modulo: { titulo: "Modulo 1" } },
      { id: "sec-b", titulo: "B", orden: 2, moduloId: "m1", modulo: { titulo: "Modulo 1" } },
      { id: "sec-c", titulo: "C", orden: 3, moduloId: "m1", modulo: { titulo: "Modulo 1" } },
    ])

    const response = await service.obtenerAvance(COLAB, CURSO)

    expect(response.seccionesCompletadas).toBe(2)
    expect(response.seccionesObligatorias).toBe(8)
    expect(response.porcentajeAvance).toBe(25) // 2/8 = 25%
    expect(response.seccionesAbiertasIds).toEqual(["sec-a", "sec-b"])
    // Siguiente seccion: primera no abierta del catalogo.
    expect(response.siguienteSeccion).toEqual({
      seccionId: "sec-c",
      moduloId: "m1",
      titulo: "C",
    })
    // No se llama al plan personal para voluntarios.
    expect(plan.obtenerPorcentajeAvance).not.toHaveBeenCalled()
  })

  it("voluntario sin aperturas: 0% pero seccionesObligatorias > 0 (no 2 de 0)", async () => {
    prisma.seccion.count.mockResolvedValueOnce(5)
    const response = await service.obtenerAvance(COLAB, CURSO)
    expect(response.seccionesCompletadas).toBe(0)
    expect(response.seccionesObligatorias).toBe(5)
    expect(response.porcentajeAvance).toBe(0)
  })

  it("voluntario que recorrio todo el curso: 100%, sin siguiente seccion", async () => {
    prisma.aperturaSeccion.findMany.mockResolvedValueOnce([
      { seccionId: "sec-a" },
      { seccionId: "sec-b" },
    ])
    prisma.seccion.count.mockResolvedValueOnce(2)
    prisma.seccion.findMany.mockResolvedValueOnce([
      { id: "sec-a", titulo: "A", orden: 1, moduloId: "m1", modulo: { titulo: "M1" } },
      { id: "sec-b", titulo: "B", orden: 2, moduloId: "m1", modulo: { titulo: "M1" } },
    ])
    const response = await service.obtenerAvance(COLAB, CURSO)
    expect(response.porcentajeAvance).toBe(100)
    expect(response.siguienteSeccion).toBeNull()
  })

  it("voluntario en curso sin secciones declaradas: 0% sin division por cero", async () => {
    prisma.seccion.count.mockResolvedValueOnce(0)
    const response = await service.obtenerAvance(COLAB, CURSO)
    expect(response.seccionesObligatorias).toBe(0)
    expect(response.porcentajeAvance).toBe(0)
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
      rol: RolAsignacion.ASIGNADO,
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
