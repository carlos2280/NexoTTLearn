import { NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import { ReportesService } from "./reportes.service"
import { ALERTA_SIN_ACTIVIDAD_DIAS } from "./reportes.types"

const MS_DIA = 86_400_000

interface PrismaMock {
  asignacionCurso: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  curso: { findUnique: ReturnType<typeof vi.fn> }
  cursoFotografiaCierre: { findUnique: ReturnType<typeof vi.fn> }
  cursoSkillExigida: { findMany: ReturnType<typeof vi.fn> }
  notaSkill: { findMany: ReturnType<typeof vi.fn> }
  intentoBloque: {
    findMany: ReturnType<typeof vi.fn>
    groupBy: ReturnType<typeof vi.fn>
  }
  intentoTransversal: {
    findMany: ReturnType<typeof vi.fn>
    groupBy: ReturnType<typeof vi.fn>
  }
  intentoEntrevistaIA: {
    findMany: ReturnType<typeof vi.fn>
    groupBy: ReturnType<typeof vi.fn>
  }
  logCambioCurso: { findMany: ReturnType<typeof vi.fn> }
  historicoEstadoAsignacion: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

interface PlanServiceMock {
  obtenerPorcentajeAvance: ReturnType<typeof vi.fn>
}

function buildPlanServiceMock(): PlanServiceMock {
  return { obtenerPorcentajeAvance: vi.fn().mockResolvedValue(0) }
}

function buildService(prisma: PrismaMock, planService: PlanServiceMock): ReportesService {
  return new ReportesService(
    prisma as unknown as PrismaService,
    planService as unknown as PlanPersonalService,
  )
}

function buildPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    asignacionCurso: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    curso: { findUnique: vi.fn() },
    cursoFotografiaCierre: { findUnique: vi.fn() },
    cursoSkillExigida: { findMany: vi.fn() },
    notaSkill: { findMany: vi.fn() },
    intentoBloque: { findMany: vi.fn(), groupBy: vi.fn() },
    intentoTransversal: { findMany: vi.fn(), groupBy: vi.fn() },
    intentoEntrevistaIA: { findMany: vi.fn(), groupBy: vi.fn() },
    logCambioCurso: { findMany: vi.fn() },
    historicoEstadoAsignacion: { findMany: vi.fn() },
    $transaction: vi.fn(),
  }
  prisma.$transaction.mockImplementation((arg: unknown) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg)
    }
    if (typeof arg === "function") {
      return (arg as (tx: PrismaMock) => Promise<unknown>)(prisma)
    }
    return Promise.resolve(arg)
  })
  return prisma
}

const CURSO_ID = "11111111-1111-1111-1111-111111111111"
const COLAB_ID = "22222222-2222-2222-2222-222222222222"
const COLAB_ID_2 = "33333333-3333-3333-3333-333333333333"
const COLAB_ID_3 = "55555555-5555-5555-5555-555555555555"
const ASIG_ID = "44444444-4444-4444-4444-444444444444"
const ASIG_ID_2 = "44444444-4444-4444-4444-555555555555"
const ASIG_ID_3 = "44444444-4444-4444-4444-666666666666"
const SKILL_ID = "66666666-6666-6666-6666-666666666666"

function dec(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value)
}

describe("ReportesService.obtenerAvanceCurso (vista=ACTUAL)", () => {
  let prisma: PrismaMock
  let planService: PlanServiceMock
  let service: ReportesService

  beforeEach(() => {
    prisma = buildPrismaMock()
    planService = buildPlanServiceMock()
    service = buildService(prisma, planService)
  })

  it("colaborador sin intentos -> alerta SIN_ACTIVIDAD_7_DIAS + asignado sin plan -> PLAN_NO_CALCULADO", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      {
        id: ASIG_ID,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
        estadoVoluntario: null,
        colaboradorId: COLAB_ID,
        colaborador: { id: COLAB_ID, nombre: "Ana", email: "ana@test" },
        plan: null,
      },
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)
    prisma.intentoBloque.groupBy.mockResolvedValueOnce([])
    prisma.intentoTransversal.groupBy.mockResolvedValueOnce([])
    prisma.intentoEntrevistaIA.groupBy.mockResolvedValueOnce([])
    prisma.intentoBloque.findMany.mockResolvedValueOnce([])

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      page: 1,
      pageSize: 20,
      format: "json",
    })

    expect(result.data).toHaveLength(1)
    const fila = result.data[0]
    if (!(fila && "alertas" in fila)) {
      throw new Error("fila esperada de tipo FilaAvanceCurso")
    }
    expect(fila.alertas).toEqual(
      expect.arrayContaining(["SIN_ACTIVIDAD_7_DIAS", "PLAN_NO_CALCULADO"]),
    )
    expect(fila.estado).toBe("EN_PROGRESO")
    // Sin plan: el wrapper resuelve 0 sin invocar al motor (FIX-P11b-avance).
    expect(fila.porcentajeAvance).toBe(0)
    expect(planService.obtenerPorcentajeAvance).toHaveBeenCalledWith(ASIG_ID)
  })

  it("plan desactualizado + intento invalidado reciente -> 2 alertas concretas", async () => {
    const fechaReciente = new Date(Date.now() - 2 * MS_DIA)
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      {
        id: ASIG_ID,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
        estadoVoluntario: null,
        colaboradorId: COLAB_ID,
        colaborador: { id: COLAB_ID, nombre: "Ana", email: "ana@test" },
        plan: { id: "plan-1", estaDesactualizado: true },
      },
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)
    prisma.intentoBloque.groupBy.mockResolvedValueOnce([
      { colaboradorId: COLAB_ID, _max: { fecha: fechaReciente } },
    ])
    prisma.intentoTransversal.groupBy.mockResolvedValueOnce([])
    prisma.intentoEntrevistaIA.groupBy.mockResolvedValueOnce([])
    prisma.intentoBloque.findMany.mockResolvedValueOnce([{ colaboradorId: COLAB_ID }])
    planService.obtenerPorcentajeAvance.mockResolvedValueOnce(42.5)

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      page: 1,
      pageSize: 20,
      format: "json",
    })

    const fila = result.data[0]
    if (!(fila && "alertas" in fila)) {
      throw new Error("fila esperada FilaAvanceCurso")
    }
    expect(fila.alertas).toEqual(["PLAN_DESACTUALIZADO", "INTENTO_INVALIDADO_RECIENTE"])
    expect(fila.porcentajeAvance).toBe(42.5)
  })

  it("colaborador limpio (intento reciente + plan vigente) -> 0 alertas", async () => {
    const fechaHoy = new Date()
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      {
        id: ASIG_ID,
        rol: "ASIGNADO",
        estadoAsignado: "LISTO",
        estadoVoluntario: null,
        colaboradorId: COLAB_ID,
        colaborador: { id: COLAB_ID, nombre: "Ana", email: "ana@test" },
        plan: { id: "plan-1", estaDesactualizado: false },
      },
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)
    prisma.intentoBloque.groupBy.mockResolvedValueOnce([
      { colaboradorId: COLAB_ID, _max: { fecha: fechaHoy } },
    ])
    prisma.intentoTransversal.groupBy.mockResolvedValueOnce([])
    prisma.intentoEntrevistaIA.groupBy.mockResolvedValueOnce([])
    prisma.intentoBloque.findMany.mockResolvedValueOnce([])
    planService.obtenerPorcentajeAvance.mockResolvedValueOnce(100)

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      page: 1,
      pageSize: 20,
      format: "json",
    })

    const fila = result.data[0]
    if (!(fila && "alertas" in fila)) {
      throw new Error("fila esperada FilaAvanceCurso")
    }
    expect(fila.alertas).toEqual([])
    expect(fila.porcentajeAvance).toBe(100)
  })

  it("SIN_ACTIVIDAD_7_DIAS dispara cuando el ultimo intento supera la ventana", async () => {
    const fechaVieja = new Date(Date.now() - (ALERTA_SIN_ACTIVIDAD_DIAS + 2) * MS_DIA)
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      {
        id: ASIG_ID,
        rol: "VOLUNTARIO",
        estadoAsignado: null,
        estadoVoluntario: "EN_PROGRESO",
        colaboradorId: COLAB_ID,
        colaborador: { id: COLAB_ID, nombre: "Vol", email: "v@test" },
        plan: null,
      },
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(1)
    prisma.intentoBloque.groupBy.mockResolvedValueOnce([
      { colaboradorId: COLAB_ID, _max: { fecha: fechaVieja } },
    ])
    prisma.intentoTransversal.groupBy.mockResolvedValueOnce([])
    prisma.intentoEntrevistaIA.groupBy.mockResolvedValueOnce([])
    prisma.intentoBloque.findMany.mockResolvedValueOnce([])

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      page: 1,
      pageSize: 20,
      format: "json",
    })
    const fila = result.data[0]
    if (!(fila && "alertas" in fila)) {
      throw new Error("fila esperada FilaAvanceCurso")
    }
    // VOLUNTARIO sin plan no dispara PLAN_NO_CALCULADO (regla solo ASIGNADO).
    expect(fila.alertas).toEqual(["SIN_ACTIVIDAD_7_DIAS"])
    expect(fila.estado).toBe("EN_PROGRESO")
  })

  it("FIX-P11b-avance: cada asignacion recibe su propio porcentaje (no comparten)", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      {
        id: ASIG_ID,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
        estadoVoluntario: null,
        colaboradorId: COLAB_ID,
        colaborador: { id: COLAB_ID, nombre: "Ana", email: "ana@test" },
        plan: { id: "p1", estaDesactualizado: false },
      },
      {
        id: ASIG_ID_2,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
        estadoVoluntario: null,
        colaboradorId: COLAB_ID_2,
        colaborador: { id: COLAB_ID_2, nombre: "Beto", email: "b@test" },
        plan: { id: "p2", estaDesactualizado: false },
      },
      {
        id: ASIG_ID_3,
        rol: "ASIGNADO",
        estadoAsignado: "LISTO",
        estadoVoluntario: null,
        colaboradorId: COLAB_ID_3,
        colaborador: { id: COLAB_ID_3, nombre: "Carla", email: "c@test" },
        plan: { id: "p3", estaDesactualizado: false },
      },
    ])
    prisma.asignacionCurso.count.mockResolvedValueOnce(3)
    prisma.intentoBloque.groupBy.mockResolvedValueOnce([])
    prisma.intentoTransversal.groupBy.mockResolvedValueOnce([])
    prisma.intentoEntrevistaIA.groupBy.mockResolvedValueOnce([])
    prisma.intentoBloque.findMany.mockResolvedValueOnce([])
    // Una resolucion distinta por cada asignacion en el orden del findMany.
    planService.obtenerPorcentajeAvance
      .mockResolvedValueOnce(15.5)
      .mockResolvedValueOnce(60)
      .mockResolvedValueOnce(100)

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      page: 1,
      pageSize: 20,
      format: "json",
    })

    expect(result.data).toHaveLength(3)
    const filas = result.data.filter(
      (fila): fila is Extract<typeof fila, { porcentajeAvance: number }> =>
        "porcentajeAvance" in fila,
    )
    const porId = new Map(filas.map((fila) => [fila.asignacionId, fila]))
    expect(porId.get(ASIG_ID)?.porcentajeAvance).toBe(15.5)
    expect(porId.get(ASIG_ID_2)?.porcentajeAvance).toBe(60)
    expect(porId.get(ASIG_ID_3)?.porcentajeAvance).toBe(100)
    expect(planService.obtenerPorcentajeAvance).toHaveBeenCalledTimes(3)
    expect(planService.obtenerPorcentajeAvance).toHaveBeenNthCalledWith(1, ASIG_ID)
    expect(planService.obtenerPorcentajeAvance).toHaveBeenNthCalledWith(2, ASIG_ID_2)
    expect(planService.obtenerPorcentajeAvance).toHaveBeenNthCalledWith(3, ASIG_ID_3)
  })

  it("FIX-P11b-avance: sin asignaciones no invoca al motor de avance", async () => {
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([])
    prisma.asignacionCurso.count.mockResolvedValueOnce(0)

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      page: 1,
      pageSize: 20,
      format: "json",
    })

    expect(result.data).toHaveLength(0)
    expect(planService.obtenerPorcentajeAvance).not.toHaveBeenCalled()
  })
})

describe("ReportesService.obtenerAvanceCurso (vista=FOTOGRAFIA_CIERRE)", () => {
  let prisma: PrismaMock
  let planService: PlanServiceMock
  let service: ReportesService

  beforeEach(() => {
    prisma = buildPrismaMock()
    planService = buildPlanServiceMock()
    service = buildService(prisma, planService)
  })

  it("reconstruye filas desde snapshot v1 valido", async () => {
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      snapshot: {
        versionSnapshot: 1,
        asignaciones: [
          {
            asignacionId: ASIG_ID,
            colaborador: { id: COLAB_ID, nombre: "Ana", email: "ana@test" },
            estado: "APTO",
            porcentajeAvance: 95,
          },
        ],
      },
    })

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "FOTOGRAFIA_CIERRE",
      page: 1,
      pageSize: 20,
      format: "json",
    })

    expect(result.data).toHaveLength(1)
    const fila = result.data[0]
    if (!(fila && "alertas" in fila)) {
      throw new Error("fila esperada FilaAvanceCurso")
    }
    expect(fila.asignacionId).toBe(ASIG_ID)
    expect(fila.porcentajeAvance).toBe(95)
    expect(fila.alertas).toEqual([])
  })

  it("404 fotografiaNoEncontrada si la fotografia esta descartada", async () => {
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: true,
      snapshot: { versionSnapshot: 1, asignaciones: [] },
    })
    await expect(
      service.obtenerAvanceCurso({
        cursoId: CURSO_ID,
        vista: "FOTOGRAFIA_CIERRE",
        page: 1,
        pageSize: 20,
        format: "json",
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it("404 fotografiaNoEncontrada si no existe la fotografia", async () => {
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.obtenerAvanceCurso({
        cursoId: CURSO_ID,
        vista: "FOTOGRAFIA_CIERRE",
        page: 1,
        pageSize: 20,
        format: "json",
      }),
    ).rejects.toThrow(NotFoundException)
  })
})

describe("ReportesService.obtenerAvanceCurso (vista=HISTORICO)", () => {
  let prisma: PrismaMock
  let planService: PlanServiceMock
  let service: ReportesService

  beforeEach(() => {
    prisma = buildPrismaMock()
    planService = buildPlanServiceMock()
    service = buildService(prisma, planService)
  })

  it("mezcla log_cambios_curso + historico_estados_asignacion ordenado DESC", async () => {
    const fechaA = new Date("2026-04-01T10:00:00Z")
    const fechaB = new Date("2026-04-02T10:00:00Z")
    prisma.logCambioCurso.findMany.mockResolvedValueOnce([
      {
        id: "log-1",
        fecha: fechaA,
        accion: "CIERRE",
        motivo: "Cierre formal",
        autorUsuario: { colaborador: { nombre: "Admin" } },
      },
    ])
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValueOnce([
      {
        id: "hist-1",
        fecha: fechaB,
        estadoAnterior: "EN_PROGRESO",
        estadoNuevo: "APTO",
        motivo: null,
        autorUsuario: { colaborador: { nombre: "Admin" } },
      },
    ])

    const result = await service.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "HISTORICO",
      page: 1,
      pageSize: 20,
      format: "json",
    })

    expect(result.data).toHaveLength(2)
    const primero = result.data[0]
    if (!(primero && "tipoCambio" in primero)) {
      throw new Error("primer evento esperado")
    }
    // fechaB > fechaA -> primero
    expect(primero.tipoCambio).toBe("ASIGNACION_ESTADO")
    expect(primero.valorPrev).toBe("EN_PROGRESO")
    expect(primero.valorNuevo).toBe("APTO")
  })
})

describe("ReportesService.obtenerDetalleColaborador", () => {
  let prisma: PrismaMock
  let planService: PlanServiceMock
  let service: ReportesService

  beforeEach(() => {
    prisma = buildPrismaMock()
    planService = buildPlanServiceMock()
    service = buildService(prisma, planService)
  })

  it("404 si la asignacion no existe", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.obtenerDetalleColaborador({
        cursoId: CURSO_ID,
        colaboradorId: COLAB_ID,
        vista: "ACTUAL",
        format: "json",
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it("422 vistaNoSoportada si vista !== ACTUAL en P11b", async () => {
    await expect(
      service.obtenerDetalleColaborador({
        cursoId: CURSO_ID,
        colaboradorId: COLAB_ID,
        vista: "HISTORICO",
        format: "json",
      }),
    ).rejects.toThrow(UnprocessableEntityException)
  })

  it("hayMas.bloque=true cuando hay >TOPE intentos; recorta a TOPE", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG_ID,
      rol: "ASIGNADO",
      estadoAsignado: "EN_PROGRESO",
      estadoVoluntario: null,
      fechaInicio: new Date("2026-01-01T00:00:00Z"),
      fechaCierre: null,
      plan: { id: "p1", items: [] },
    })
    prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([])
    // 21 intentos de bloque -> hayMas=true, lista debe llegar a 20.
    const intentos = Array.from({ length: 21 }, (_, i) => ({
      id: `intento-${i}`,
      bloqueId: "b1",
      fecha: new Date(),
      nota: dec(50),
      estaInvalidado: false,
    }))
    prisma.intentoBloque.findMany.mockResolvedValueOnce(intentos)
    prisma.intentoTransversal.findMany.mockResolvedValueOnce([])
    prisma.intentoEntrevistaIA.findMany.mockResolvedValueOnce([])

    const result = await service.obtenerDetalleColaborador({
      cursoId: CURSO_ID,
      colaboradorId: COLAB_ID,
      vista: "ACTUAL",
      format: "json",
    })

    expect(result.ultimosIntentos.bloque).toHaveLength(20)
    expect(result.hayMas.bloque).toBe(true)
    expect(result.hayMas.transversal).toBe(false)
  })
})

describe("ReportesService.obtenerBrechasDetectadas", () => {
  let prisma: PrismaMock
  let planService: PlanServiceMock
  let service: ReportesService

  beforeEach(() => {
    prisma = buildPrismaMock()
    planService = buildPlanServiceMock()
    service = buildService(prisma, planService)
  })

  it("clasifica notas vs umbrales por skill (no_cumple/cerca/cumple)", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({
      id: CURSO_ID,
      umbralNoCumple: dec(40),
      umbralesLogro: { excelencia: 90, solido: 75, enDesarrollo: 50 },
    })
    prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([
      {
        skillId: SKILL_ID,
        notaMinima: dec(70),
        skill: { id: SKILL_ID, etiquetaVisible: "azure.databricks" },
      },
    ])
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([
      { colaboradorId: COLAB_ID },
      { colaboradorId: COLAB_ID_2 },
      { colaboradorId: ASIG_ID },
    ])
    prisma.notaSkill.findMany.mockResolvedValueOnce([
      { skillId: SKILL_ID, colaboradorId: COLAB_ID, notaActual: dec(85) }, // cumple
      { skillId: SKILL_ID, colaboradorId: COLAB_ID_2, notaActual: dec(60) }, // cerca
      // ASIG_ID sin nota -> no_cumple
    ])

    const result = await service.obtenerBrechasDetectadas({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      format: "json",
    })

    expect(result.skills).toHaveLength(1)
    const skill = result.skills[0]
    if (!skill) {
      throw new Error("skill esperada")
    }
    expect(skill.cumple).toBe(1)
    expect(skill.cerca).toBe(1)
    expect(skill.noCumple).toBe(1)
    expect(result.umbrales.umbralAprobado).toBe(75)
    expect(result.umbrales.umbralExcelencia).toBe(90)
  })

  it("umbrales default cuando umbralesLogro=null", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({
      id: CURSO_ID,
      umbralNoCumple: dec(40),
      umbralesLogro: null,
    })
    prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([])
    prisma.asignacionCurso.findMany.mockResolvedValueOnce([])
    const result = await service.obtenerBrechasDetectadas({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      format: "json",
    })
    expect(result.umbrales.umbralAprobado).toBe(70)
    expect(result.umbrales.umbralExcelencia).toBe(85)
    expect(result.umbrales.umbralCumple).toBeNull()
  })

  it("422 vistaNoSoportada si vista !== ACTUAL", async () => {
    await expect(
      service.obtenerBrechasDetectadas({
        cursoId: CURSO_ID,
        vista: "FOTOGRAFIA_CIERRE",
        format: "json",
      }),
    ).rejects.toThrow(UnprocessableEntityException)
  })
})

describe("ReportesService.obtenerCentroRevision", () => {
  let prisma: PrismaMock
  let planService: PlanServiceMock
  let service: ReportesService

  beforeEach(() => {
    prisma = buildPrismaMock()
    planService = buildPlanServiceMock()
    service = buildService(prisma, planService)
  })

  it("tipo=TRANSVERSAL: 1 fila por capa pendiente", async () => {
    prisma.intentoTransversal.findMany.mockResolvedValueOnce([
      {
        id: "int-1",
        fechaFinalizacion: new Date(),
        notaCapaTests: null,
        notaCapaCualitativa: null,
        notaCapaComprension: dec(80),
        colaborador: { id: COLAB_ID, nombre: "Ana", email: "ana@test" },
        transversal: { cursoId: CURSO_ID },
      },
    ])
    const result = await service.obtenerCentroRevision({
      tipo: "TRANSVERSAL",
      vista: "ACTUAL",
      format: "json",
    })
    expect(result.transversales).toHaveLength(2)
    expect(result.transversales.map((r) => r.motivoRevision)).toEqual([
      "CAPA_PENDIENTE_TESTS",
      "CAPA_PENDIENTE_CUALITATIVA",
    ])
    expect(result.entrevistasIa).toHaveLength(0)
    expect(result.totales.transversales).toBe(2)
  })

  it("tipo=ENTREVISTA_IA: lista solo entrevistas pendientes de ajuste", async () => {
    prisma.intentoEntrevistaIA.findMany.mockResolvedValueOnce([
      {
        id: "eia-1",
        fechaFinalizacion: new Date(),
        colaborador: { id: COLAB_ID_2, nombre: "Beto", email: "b@test" },
        entrevistaIA: { cursoId: CURSO_ID },
      },
    ])
    const result = await service.obtenerCentroRevision({
      tipo: "ENTREVISTA_IA",
      vista: "ACTUAL",
      format: "json",
    })
    expect(result.entrevistasIa).toHaveLength(1)
    expect(result.entrevistasIa[0]?.motivoRevision).toBe("AJUSTE_ADMIN_PENDIENTE")
    expect(result.transversales).toHaveLength(0)
  })

  it("tipo=TODAS combina ambos + totales correctos", async () => {
    prisma.intentoTransversal.findMany.mockResolvedValueOnce([
      {
        id: "int-1",
        fechaFinalizacion: new Date(),
        notaCapaTests: null,
        notaCapaCualitativa: dec(70),
        notaCapaComprension: dec(80),
        colaborador: { id: COLAB_ID, nombre: "Ana", email: "ana@test" },
        transversal: { cursoId: CURSO_ID },
      },
    ])
    prisma.intentoEntrevistaIA.findMany.mockResolvedValueOnce([
      {
        id: "eia-1",
        fechaFinalizacion: new Date(),
        colaborador: { id: COLAB_ID_2, nombre: "Beto", email: "b@test" },
        entrevistaIA: { cursoId: CURSO_ID },
      },
    ])
    const result = await service.obtenerCentroRevision({
      tipo: "TODAS",
      vista: "ACTUAL",
      format: "json",
    })
    expect(result.totales).toEqual({ transversales: 1, entrevistasIa: 1 })
  })
})
