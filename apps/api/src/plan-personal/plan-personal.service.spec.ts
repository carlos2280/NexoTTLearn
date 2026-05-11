import { ConflictException, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type {
  FichaSnapshotV1,
  PlanResponseAdmin,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"
import { RolAsignacion, RolUsuario } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import type { SesionUsuario } from "../common/types/sesion.types"
import { calcularAvance, calcularPlan, toPlanResponse } from "./plan-personal.helpers"
import { PlanPersonalService } from "./plan-personal.service"

const ASIGNACION_ID = "a0000000-0000-0000-0000-000000000001"
const CURSO_ID = "c0000000-0000-0000-0000-000000000001"
const COLABORADOR_ID = "f0000000-0000-0000-0000-000000000001"
const MODULO_ID_1 = "11111111-1111-1111-1111-111111111110"
const SECCION_ID_1 = "22222222-2222-2222-2222-222222222221"
const SECCION_ID_2 = "22222222-2222-2222-2222-222222222222"
const SKILL_FALTANTE = "31111111-1111-1111-1111-111111111111"
const SKILL_CERCA = "32222222-2222-2222-2222-222222222222"
const SKILL_CUMPLE = "33333333-3333-3333-3333-333333333333"
const ADMIN_USER_ID = "9000000a-0000-0000-0000-000000000001"
const PARTICIPANTE_USER_ID = "9000000b-0000-0000-0000-000000000002"

const ADMIN: SesionUsuario = { usuarioId: ADMIN_USER_ID, rol: RolUsuario.ADMIN }
const PARTICIPANTE: SesionUsuario = {
  usuarioId: PARTICIPANTE_USER_ID,
  rol: RolUsuario.PARTICIPANTE,
}

interface MockPrisma {
  asignacionCurso: {
    findUnique: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
  }
  curso: { findUniqueOrThrow: ReturnType<typeof vi.fn> }
  cursoSkillExigida: { findMany: ReturnType<typeof vi.fn> }
  cursoModuloHabilitado: { findMany: ReturnType<typeof vi.fn> }
  notaSkill: { findMany: ReturnType<typeof vi.fn> }
  seccion: { findMany: ReturnType<typeof vi.fn> }
  planEstudio: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  itemPlan: {
    findMany: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
  intentoBloque: { findMany: ReturnType<typeof vi.fn> }
  aperturaSeccion: { findMany: ReturnType<typeof vi.fn> }
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    asignacionCurso: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    curso: { findUniqueOrThrow: vi.fn() },
    cursoSkillExigida: { findMany: vi.fn().mockResolvedValue([]) },
    cursoModuloHabilitado: { findMany: vi.fn().mockResolvedValue([]) },
    notaSkill: { findMany: vi.fn().mockResolvedValue([]) },
    seccion: { findMany: vi.fn().mockResolvedValue([]) },
    planEstudio: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    itemPlan: {
      findMany: vi.fn().mockResolvedValue([]),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    intentoBloque: { findMany: vi.fn().mockResolvedValue([]) },
    aperturaSeccion: { findMany: vi.fn().mockResolvedValue([]) },
    usuario: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(
    (arg: ((tx: MockPrisma) => Promise<unknown>) | readonly Promise<unknown>[]) => {
      if (typeof arg === "function") {
        return arg(mock)
      }
      return Promise.all(arg)
    },
  )
  return mock
}

let prisma: MockPrisma
let service: PlanPersonalService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: PlanPersonalService,
        useFactory: (p: PrismaService) => new PlanPersonalService(p),
        inject: [PrismaService],
      },
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile()
  service = moduleRef.get(PlanPersonalService)
})

describe("calcularPlan (motor)", () => {
  it("nota null -> notaEfectiva=0 -> SKILL_FALTANTE cuando brecha >= umbral", () => {
    const res = calcularPlan({
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      umbralNoCumple: 10,
      exigidas: [{ skillId: SKILL_FALTANTE, notaMinima: 70 }],
      notas: [],
      secciones: [
        {
          seccionId: SECCION_ID_1,
          moduloId: MODULO_ID_1,
          seccionTitulo: "S1",
          tituloModulo: "M1",
          skillIds: [SKILL_FALTANTE],
        },
      ],
    })
    expect(res.items).toHaveLength(1)
    expect(res.items[0]).toEqual({
      moduloId: MODULO_ID_1,
      seccionId: SECCION_ID_1,
      caracter: "OBLIGATORIA",
      razon: "SKILL_FALTANTE",
    })
    expect(res.fichaSnapshot.skillsConsideradas[0]).toMatchObject({
      skillId: SKILL_FALTANTE,
      nota: null,
      origen: "SIN_NOTA",
      brecha: 70,
      estado: "NO_CUMPLE",
    })
  })

  it("brecha exactamente igual a umbralNoCumple -> SKILL_FALTANTE (borde alto)", () => {
    const res = calcularPlan({
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      umbralNoCumple: 10,
      exigidas: [{ skillId: SKILL_FALTANTE, notaMinima: 70 }],
      notas: [{ skillId: SKILL_FALTANTE, notaActual: 60, origen: "MANUAL" }],
      secciones: [
        {
          seccionId: SECCION_ID_1,
          moduloId: MODULO_ID_1,
          seccionTitulo: "S1",
          tituloModulo: "M1",
          skillIds: [SKILL_FALTANTE],
        },
      ],
    })
    expect(res.items[0]?.razon).toBe("SKILL_FALTANTE")
    expect(res.fichaSnapshot.skillsConsideradas[0]?.estado).toBe("NO_CUMPLE")
  })

  it("brecha 0 -> SKILL_YA_CUMPLE (borde bajo)", () => {
    const res = calcularPlan({
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      umbralNoCumple: 10,
      exigidas: [{ skillId: SKILL_CUMPLE, notaMinima: 70 }],
      notas: [{ skillId: SKILL_CUMPLE, notaActual: 70, origen: "MANUAL" }],
      secciones: [
        {
          seccionId: SECCION_ID_1,
          moduloId: MODULO_ID_1,
          seccionTitulo: "S1",
          tituloModulo: "M1",
          skillIds: [SKILL_CUMPLE],
        },
      ],
    })
    expect(res.items[0]?.caracter).toBe("OPCIONAL")
    expect(res.items[0]?.razon).toBe("SKILL_YA_CUMPLE")
    expect(res.fichaSnapshot.skillsConsideradas[0]?.estado).toBe("CUMPLE")
  })

  it("brecha < umbral -> SKILL_CERCA + OBLIGATORIA", () => {
    const res = calcularPlan({
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      umbralNoCumple: 10,
      exigidas: [{ skillId: SKILL_CERCA, notaMinima: 70 }],
      notas: [{ skillId: SKILL_CERCA, notaActual: 65, origen: "BLOQUE" }],
      secciones: [
        {
          seccionId: SECCION_ID_1,
          moduloId: MODULO_ID_1,
          seccionTitulo: "S1",
          tituloModulo: "M1",
          skillIds: [SKILL_CERCA],
        },
      ],
    })
    expect(res.items[0]?.caracter).toBe("OBLIGATORIA")
    expect(res.items[0]?.razon).toBe("SKILL_CERCA")
  })

  it("seccion sin skills del curso NO entra al plan", () => {
    const res = calcularPlan({
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      umbralNoCumple: 10,
      exigidas: [{ skillId: SKILL_FALTANTE, notaMinima: 70 }],
      notas: [],
      secciones: [
        {
          seccionId: SECCION_ID_1,
          moduloId: MODULO_ID_1,
          seccionTitulo: "S1",
          tituloModulo: "M1",
          skillIds: ["otraSkill"],
        },
      ],
    })
    expect(res.items).toHaveLength(0)
  })

  it("razon dominante SKILL_FALTANTE cuando hay 1 faltante + 1 cerca", () => {
    const res = calcularPlan({
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      umbralNoCumple: 10,
      exigidas: [
        { skillId: SKILL_FALTANTE, notaMinima: 70 },
        { skillId: SKILL_CERCA, notaMinima: 70 },
      ],
      notas: [
        { skillId: SKILL_FALTANTE, notaActual: 20, origen: "MANUAL" },
        { skillId: SKILL_CERCA, notaActual: 65, origen: "BLOQUE" },
      ],
      secciones: [
        {
          seccionId: SECCION_ID_1,
          moduloId: MODULO_ID_1,
          seccionTitulo: "S1",
          tituloModulo: "M1",
          skillIds: [SKILL_FALTANTE, SKILL_CERCA],
        },
      ],
    })
    expect(res.items[0]?.razon).toBe("SKILL_FALTANTE")
    expect(res.items[0]?.caracter).toBe("OBLIGATORIA")
  })

  it("seccion con todas skills CUMPLE -> OPCIONAL", () => {
    const res = calcularPlan({
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      umbralNoCumple: 10,
      exigidas: [{ skillId: SKILL_CUMPLE, notaMinima: 70 }],
      notas: [{ skillId: SKILL_CUMPLE, notaActual: 90, origen: "MANUAL" }],
      secciones: [
        {
          seccionId: SECCION_ID_1,
          moduloId: MODULO_ID_1,
          seccionTitulo: "S1",
          tituloModulo: "M1",
          skillIds: [SKILL_CUMPLE],
        },
      ],
    })
    expect(res.items[0]?.caracter).toBe("OPCIONAL")
    expect(res.items[0]?.razon).toBe("SKILL_YA_CUMPLE")
  })
})

describe("calcularAvance (% al vuelo)", () => {
  it("0 secciones obligatorias -> 100%", () => {
    const { avancePlan } = calcularAvance({
      seccionesObligatorias: [],
      mejoresIntentosVigentes: [],
      aperturas: [],
    })
    expect(avancePlan.porcentaje).toBe(100)
    expect(avancePlan.seccionesObligatorias).toBe(0)
  })

  it("4 de 12 -> 33.33% (redondeo a 2 decimales)", () => {
    const obligatorias = Array.from({ length: 12 }).map((_, i) => ({
      seccionId: `s${i}`,
      bloques: [{ id: `b${i}` }],
    }))
    const { avancePlan } = calcularAvance({
      seccionesObligatorias: obligatorias,
      mejoresIntentosVigentes: [0, 1, 2, 3].map((i) => ({ bloqueId: `b${i}`, notaNum: 80 })),
      aperturas: [],
    })
    expect(avancePlan.porcentaje).toBe(33.33)
    expect(avancePlan.seccionesCompletadas).toBe(4)
  })

  it("seccion sin bloques requiere AperturaSeccion para completarse", () => {
    const { avancePlan, porSeccion } = calcularAvance({
      seccionesObligatorias: [
        { seccionId: SECCION_ID_1, bloques: [] },
        { seccionId: SECCION_ID_2, bloques: [] },
      ],
      mejoresIntentosVigentes: [],
      aperturas: [{ seccionId: SECCION_ID_1 }],
    })
    expect(porSeccion.get(SECCION_ID_1)?.completada).toBe(true)
    expect(porSeccion.get(SECCION_ID_2)?.completada).toBe(false)
    expect(avancePlan.porcentaje).toBe(50)
  })
})

describe("toPlanResponse (visibilidad D90)", () => {
  const baseFicha: FichaSnapshotV1 = {
    fechaCalculo: new Date().toISOString(),
    versionSnapshot: 1,
    skillsConsideradas: [],
  }
  const baseInput = {
    planId: "plan-1",
    asignacionId: ASIGNACION_ID,
    fechaCalculo: new Date("2026-05-11T10:00:00Z"),
    estaDesactualizado: false,
    fichaSnapshot: baseFicha,
    items: [
      {
        moduloId: MODULO_ID_1,
        seccionId: SECCION_ID_1,
        caracter: "OBLIGATORIA" as const,
        razon: "SKILL_FALTANTE" as const,
      },
    ],
    modulosSecciones: [
      {
        moduloId: MODULO_ID_1,
        tituloModulo: "M1",
        seccionId: SECCION_ID_1,
        seccionTitulo: "S1",
      },
    ],
    avance: { seccionesCompletadas: 0, seccionesObligatorias: 1, porcentaje: 0 },
    porSeccion: new Map(),
  }

  it("ADMIN incluye estaDesactualizado, fichaSnapshot y razon", () => {
    const res = toPlanResponse({ ...baseInput, rol: RolUsuario.ADMIN }) as PlanResponseAdmin
    expect(res.estaDesactualizado).toBe(false)
    expect(res.fichaSnapshot).toBeDefined()
    expect(res.items[0]?.secciones[0]?.razon).toBe("SKILL_FALTANTE")
  })

  it("PARTICIPANTE NO contiene las claves estaDesactualizado/fichaSnapshot/razon", () => {
    const res = toPlanResponse({
      ...baseInput,
      rol: RolUsuario.PARTICIPANTE,
    }) as PlanResponseParticipante
    expect(Object.hasOwn(res, "estaDesactualizado")).toBe(false)
    expect(Object.hasOwn(res, "fichaSnapshot")).toBe(false)
    const seccion = res.items[0]?.secciones[0]
    if (!seccion) {
      throw new Error("seccion missing in test setup")
    }
    expect(Object.hasOwn(seccion, "razon")).toBe(false)
  })
})

describe("PlanPersonalService.calcularExplicito", () => {
  it("409 conflictPlanYaCalculado si el plan ya existe", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
    })
    prisma.planEstudio.findUnique.mockResolvedValue({
      id: "plan-existente",
      fechaCalculo: new Date("2026-05-01T10:00:00Z"),
    })

    await expect(service.calcularExplicito(ASIGNACION_ID)).rejects.toBeInstanceOf(ConflictException)
  })

  it("404 si la asignacion no existe", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(service.calcularExplicito(ASIGNACION_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("422 si el rol es VOLUNTARIO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
    })
    await expect(service.calcularExplicito(ASIGNACION_ID)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    )
  })
})

describe("PlanPersonalService.recalcular", () => {
  it("404 planNoEncontrado si no hay plan previo", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
    })
    prisma.planEstudio.findUnique.mockResolvedValue(null)

    await expect(service.recalcular(ASIGNACION_ID)).rejects.toMatchObject({
      response: { code: apiErrorCodes.planNoEncontrado },
    })
  })

  it("happy path: descarta items previos (deleteMany) y crea nuevos", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
    })
    prisma.planEstudio.findUnique
      .mockResolvedValueOnce({ id: "plan-existente" }) // primera verificacion
      .mockResolvedValueOnce({ id: "plan-existente" }) // dentro de calcularInterno
      .mockResolvedValueOnce({
        id: "plan-existente",
        asignacionId: ASIGNACION_ID,
        fechaCalculo: new Date(),
        fichaSnapshot: {
          fechaCalculo: new Date().toISOString(),
          versionSnapshot: 1,
          skillsConsideradas: [],
        },
        estaDesactualizado: false,
      })
    prisma.asignacionCurso.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: ASIGNACION_ID,
        cursoId: CURSO_ID,
        colaboradorId: COLABORADOR_ID,
      })
      .mockResolvedValueOnce({ colaboradorId: COLABORADOR_ID })
    prisma.curso.findUniqueOrThrow.mockResolvedValue({ id: CURSO_ID, umbralNoCumple: 10 })
    prisma.planEstudio.update.mockResolvedValue({ id: "plan-existente" })

    await service.recalcular(ASIGNACION_ID)

    expect(prisma.itemPlan.deleteMany).toHaveBeenCalledWith({
      where: { planId: "plan-existente" },
    })
    expect(prisma.planEstudio.update).toHaveBeenCalled()
  })
})

describe("PlanPersonalService.obtener (visibilidad)", () => {
  function configurarReadOk(): void {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      colaboradorId: COLABORADOR_ID,
    })
    prisma.planEstudio.findUnique.mockResolvedValue({
      id: "plan-1",
      asignacionId: ASIGNACION_ID,
      fechaCalculo: new Date("2026-05-11T10:00:00Z"),
      fichaSnapshot: {
        fechaCalculo: new Date().toISOString(),
        versionSnapshot: 1,
        skillsConsideradas: [],
      },
      estaDesactualizado: false,
    })
    prisma.itemPlan.findMany.mockResolvedValue([])
    prisma.seccion.findMany.mockResolvedValue([])
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
  }

  it("PARTICIPANTE ajeno -> 404 asignacionNoEncontrada (no 403)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      colaboradorId: "otro-colab",
    })
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })

    await expect(service.obtener(ASIGNACION_ID, PARTICIPANTE)).rejects.toMatchObject({
      response: { code: apiErrorCodes.asignacionNoEncontrada },
    })
  })

  it("ADMIN obtiene PlanResponseAdmin con fichaSnapshot", async () => {
    configurarReadOk()
    const res = (await service.obtener(ASIGNACION_ID, ADMIN)) as PlanResponseAdmin
    expect(res.fichaSnapshot).toBeDefined()
    expect(res.estaDesactualizado).toBe(false)
  })

  it("PARTICIPANTE propio recibe sin fichaSnapshot", async () => {
    configurarReadOk()
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    const res = (await service.obtener(ASIGNACION_ID, PARTICIPANTE)) as PlanResponseParticipante
    expect(Object.hasOwn(res, "fichaSnapshot")).toBe(false)
    expect(Object.hasOwn(res, "estaDesactualizado")).toBe(false)
  })

  it("404 planNoEncontrado si la asignacion existe pero no hay plan", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      colaboradorId: COLABORADOR_ID,
    })
    prisma.planEstudio.findUnique.mockResolvedValue(null)

    await expect(service.obtener(ASIGNACION_ID, ADMIN)).rejects.toMatchObject({
      response: { code: apiErrorCodes.planNoEncontrado },
    })
  })
})

describe("PlanPersonalService.calcularSiAsignado (cierre TODO S7)", () => {
  it("VOLUNTARIO no genera plan (noop)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
    })
    await service.calcularSiAsignado(ASIGNACION_ID)
    expect(prisma.planEstudio.create).not.toHaveBeenCalled()
  })

  it("Asignacion inexistente no lanza ni crea (defensa)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(service.calcularSiAsignado(ASIGNACION_ID)).resolves.toBeUndefined()
  })
})
