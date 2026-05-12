import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type {
  FichaSnapshotV1,
  PlanResponseAdmin,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"
import { EstadoAsignado, Prisma, RolAsignacion, RolUsuario } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuditLogService } from "../common/audit/audit-log.service"
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
const AUTOR_USUARIO_ID = ADMIN_USER_ID

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
  curso: {
    findUnique: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
  }
  cursoSkillExigida: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  cursoModuloHabilitado: {
    findMany: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
  }
  notaSkill: { findMany: ReturnType<typeof vi.fn> }
  seccion: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  planEstudio: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  itemPlan: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
  ajustePlan: { create: ReturnType<typeof vi.fn> }
  aperturaSeccion: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  intentoBloque: { findMany: ReturnType<typeof vi.fn> }
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    asignacionCurso: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    curso: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    cursoSkillExigida: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
    },
    cursoModuloHabilitado: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
    },
    notaSkill: { findMany: vi.fn().mockResolvedValue([]) },
    seccion: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
    },
    planEstudio: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    itemPlan: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      delete: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    ajustePlan: { create: vi.fn().mockResolvedValue({}) },
    aperturaSeccion: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    intentoBloque: { findMany: vi.fn().mockResolvedValue([]) },
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
        useFactory: (p: PrismaService) =>
          new PlanPersonalService(p, {
            record: vi.fn().mockResolvedValue(undefined),
          } as unknown as AuditLogService),
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

    await expect(
      service.recalcular(ASIGNACION_ID, AUTOR_USUARIO_ID, "motivo"),
    ).rejects.toMatchObject({
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

    await service.recalcular(ASIGNACION_ID, AUTOR_USUARIO_ID, "motivo")

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

// ===========================================================================
// P7c — Ajustes manuales admin + diff + apertura seccion
// ===========================================================================

const PLAN_ID = "p0000000-0000-0000-0000-000000000001"

function mockPlanConRolAsignado(): void {
  prisma.planEstudio.findUnique.mockResolvedValue({
    id: PLAN_ID,
    asignacion: { cursoId: CURSO_ID, rol: RolAsignacion.ASIGNADO },
  })
}

function mockPlanReadOk(): void {
  prisma.asignacionCurso.findUnique.mockResolvedValue({
    id: ASIGNACION_ID,
    rol: RolAsignacion.ASIGNADO,
    colaboradorId: COLABORADOR_ID,
  })
  prisma.planEstudio.findUnique.mockResolvedValueOnce({
    id: PLAN_ID,
    asignacion: { cursoId: CURSO_ID, rol: RolAsignacion.ASIGNADO },
  })
  // Para el obtenerPlanInterno posterior.
  prisma.planEstudio.findUnique.mockResolvedValue({
    id: PLAN_ID,
    asignacionId: ASIGNACION_ID,
    fechaCalculo: new Date("2026-05-11T10:00:00Z"),
    fichaSnapshot: {
      fechaCalculo: new Date().toISOString(),
      versionSnapshot: 1,
      skillsConsideradas: [],
    },
    estaDesactualizado: false,
  })
  prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
}

describe("PlanPersonalService.ajustarPlan (P7c)", () => {
  it("AGREGAR seccion valida -> create ItemPlan + AjustePlan", async () => {
    mockPlanReadOk()
    prisma.cursoModuloHabilitado.findFirst.mockResolvedValue({ moduloId: MODULO_ID_1 })
    prisma.seccion.findUnique.mockResolvedValue({ moduloId: MODULO_ID_1 })
    prisma.itemPlan.findUnique.mockResolvedValue(null)
    prisma.itemPlan.findMany.mockResolvedValue([])

    await service.ajustarPlan(
      ASIGNACION_ID,
      { accion: "AGREGAR", seccionId: SECCION_ID_1, caracter: "OBLIGATORIA" },
      ADMIN_USER_ID,
      "motivo valido",
    )

    expect(prisma.itemPlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        planId: PLAN_ID,
        seccionId: SECCION_ID_1,
        caracter: "OBLIGATORIA",
        razon: "AJUSTE_ADMIN",
      }),
    })
    expect(prisma.ajustePlan.create).toHaveBeenCalled()
  })

  it("AGREGAR seccion ya en plan -> 409 conflictSeccionYaEnPlan", async () => {
    mockPlanConRolAsignado()
    prisma.cursoModuloHabilitado.findFirst.mockResolvedValue({ moduloId: MODULO_ID_1 })
    prisma.seccion.findUnique.mockResolvedValue({ moduloId: MODULO_ID_1 })
    prisma.itemPlan.findUnique.mockResolvedValue({ id: "existente" })

    await expect(
      service.ajustarPlan(
        ASIGNACION_ID,
        { accion: "AGREGAR", seccionId: SECCION_ID_1, caracter: "OBLIGATORIA" },
        ADMIN_USER_ID,
        "motivo",
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.conflictSeccionYaEnPlan } })
  })

  it("AGREGAR seccion de otro curso -> 404 seccionNoEncontrada", async () => {
    mockPlanConRolAsignado()
    prisma.cursoModuloHabilitado.findFirst.mockResolvedValue(null)

    await expect(
      service.ajustarPlan(
        ASIGNACION_ID,
        { accion: "AGREGAR", seccionId: SECCION_ID_1, caracter: "OBLIGATORIA" },
        ADMIN_USER_ID,
        "motivo",
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.seccionNoEncontrada } })
  })

  it("QUITAR seccion que no esta en plan -> 404 seccionNoEnPlan", async () => {
    mockPlanConRolAsignado()
    prisma.itemPlan.findUnique.mockResolvedValue(null)

    await expect(
      service.ajustarPlan(
        ASIGNACION_ID,
        { accion: "QUITAR", seccionId: SECCION_ID_1 },
        ADMIN_USER_ID,
        "motivo",
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.seccionNoEnPlan } })
  })

  it("QUITAR seccion valida -> delete + AjustePlan", async () => {
    mockPlanReadOk()
    prisma.itemPlan.findUnique.mockResolvedValue({ id: "existente" })

    await service.ajustarPlan(
      ASIGNACION_ID,
      { accion: "QUITAR", seccionId: SECCION_ID_1 },
      ADMIN_USER_ID,
      "motivo",
    )

    expect(prisma.itemPlan.delete).toHaveBeenCalledWith({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        planId_seccionId: { planId: PLAN_ID, seccionId: SECCION_ID_1 },
      },
    })
    expect(prisma.ajustePlan.create).toHaveBeenCalled()
  })

  it("CAMBIAR_CARACTER OBLIGATORIA->OPCIONAL -> update + AjustePlan", async () => {
    mockPlanReadOk()
    prisma.itemPlan.findUnique.mockResolvedValue({ id: "existente" })

    await service.ajustarPlan(
      ASIGNACION_ID,
      { accion: "CAMBIAR_CARACTER", seccionId: SECCION_ID_1, caracter: "OPCIONAL" },
      ADMIN_USER_ID,
      "motivo",
    )

    expect(prisma.itemPlan.update).toHaveBeenCalledWith({
      where: {
        // biome-ignore lint/style/useNamingConvention: composite key Prisma.
        planId_seccionId: { planId: PLAN_ID, seccionId: SECCION_ID_1 },
      },
      data: { caracter: "OPCIONAL" },
    })
    expect(prisma.ajustePlan.create).toHaveBeenCalled()
  })

  it("EXIMIR skill exigida -> updateMany a OPCIONAL + AjustePlan sin seccionId", async () => {
    mockPlanReadOk()
    prisma.cursoSkillExigida.findUnique.mockResolvedValue({ skillId: SKILL_FALTANTE })
    prisma.itemPlan.findMany.mockResolvedValueOnce([{ id: "item-1" }, { id: "item-2" }])

    await service.ajustarPlan(
      ASIGNACION_ID,
      { accion: "EXIMIR", skillId: SKILL_FALTANTE },
      ADMIN_USER_ID,
      "motivo",
    )

    expect(prisma.itemPlan.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["item-1", "item-2"] } },
      data: { caracter: "OPCIONAL" },
    })
    expect(prisma.ajustePlan.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accion: "EXIMIR",
        planId: PLAN_ID,
        seccionId: null,
      }),
    })
  })

  it("EXIMIR skill no exigida en curso -> 404 skillNoEncontrada", async () => {
    mockPlanConRolAsignado()
    prisma.cursoSkillExigida.findUnique.mockResolvedValue(null)

    await expect(
      service.ajustarPlan(
        ASIGNACION_ID,
        { accion: "EXIMIR", skillId: SKILL_FALTANTE },
        ADMIN_USER_ID,
        "motivo",
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.skillNoEncontrada } })
  })

  it("Plan inexistente -> 404 planNoEncontrado", async () => {
    prisma.planEstudio.findUnique.mockResolvedValue(null)

    await expect(
      service.ajustarPlan(
        ASIGNACION_ID,
        { accion: "QUITAR", seccionId: SECCION_ID_1 },
        ADMIN_USER_ID,
        "motivo",
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.planNoEncontrado } })
  })

  it("Plan de asignacion VOLUNTARIO -> 422 conflictAsignacionNoVoluntario", async () => {
    prisma.planEstudio.findUnique.mockResolvedValue({
      id: PLAN_ID,
      asignacion: { cursoId: CURSO_ID, rol: RolAsignacion.VOLUNTARIO },
    })

    await expect(
      service.ajustarPlan(
        ASIGNACION_ID,
        { accion: "QUITAR", seccionId: SECCION_ID_1 },
        ADMIN_USER_ID,
        "motivo",
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })
})

describe("PlanPersonalService.obtenerDiff (P7c)", () => {
  function mockDiffOk(opts: {
    notaSnapshot: number | null
    notaVigente: number | null
    estadoSnapshot: "NO_CUMPLE" | "CERCA" | "CUMPLE"
    caracterActual?: "OBLIGATORIA" | "OPCIONAL"
  }): void {
    prisma.planEstudio.findUnique.mockResolvedValue({
      id: PLAN_ID,
      fechaCalculo: new Date("2026-05-11T10:00:00Z"),
      estaDesactualizado: false,
      fichaSnapshot: {
        fechaCalculo: new Date("2026-05-11T10:00:00Z").toISOString(),
        versionSnapshot: 1,
        skillsConsideradas: [
          {
            skillId: SKILL_FALTANTE,
            nota: opts.notaSnapshot,
            origen: "MANUAL",
            notaMinimaExigida: 70,
            brecha: 70 - (opts.notaSnapshot ?? 0),
            estado: opts.estadoSnapshot,
          },
        ],
      },
      asignacion: { cursoId: CURSO_ID, colaboradorId: COLABORADOR_ID },
    })
    prisma.curso.findUniqueOrThrow.mockResolvedValue({ umbralNoCumple: 10 })
    prisma.cursoSkillExigida.findMany.mockResolvedValue([
      { skillId: SKILL_FALTANTE, notaMinima: 70 },
    ])
    prisma.notaSkill.findMany.mockResolvedValue([
      { skillId: SKILL_FALTANTE, notaActual: opts.notaVigente },
    ])
    prisma.itemPlan.findMany.mockResolvedValue([
      {
        seccionId: SECCION_ID_1,
        caracter: opts.caracterActual ?? "OBLIGATORIA",
        seccion: {
          id: SECCION_ID_1,
          titulo: "S1",
          skills: [{ skillId: SKILL_FALTANTE }],
        },
      },
    ])
  }

  it("nota sube y skill pasa a CUMPLE -> impacto SECCION_DEJA_DE_SER_OBLIGATORIA", async () => {
    mockDiffOk({
      notaSnapshot: 40,
      notaVigente: 90,
      estadoSnapshot: "NO_CUMPLE",
      caracterActual: "OBLIGATORIA",
    })
    const res = await service.obtenerDiff(ASIGNACION_ID, ADMIN)
    expect(res.diff).toHaveLength(1)
    expect(res.diff[0]?.impacto).toBe("SECCION_DEJA_DE_SER_OBLIGATORIA")
    expect(res.diff[0]?.estadoVigente).toBe("CUMPLE")
    expect(res.diff[0]?.seccionesAfectadas).toHaveLength(1)
  })

  it("nota baja y skill pasa a NO_CUMPLE -> impacto SECCION_PASA_A_OBLIGATORIA", async () => {
    mockDiffOk({
      notaSnapshot: 80,
      notaVigente: 30,
      estadoSnapshot: "CUMPLE",
      caracterActual: "OPCIONAL",
    })
    const res = await service.obtenerDiff(ASIGNACION_ID, ADMIN)
    expect(res.diff[0]?.impacto).toBe("SECCION_PASA_A_OBLIGATORIA")
    expect(res.diff[0]?.estadoVigente).toBe("NO_CUMPLE")
  })

  it("sin cambios -> diff vacio", async () => {
    mockDiffOk({
      notaSnapshot: 50,
      notaVigente: 50,
      estadoSnapshot: "CERCA",
      caracterActual: "OBLIGATORIA",
    })
    const res = await service.obtenerDiff(ASIGNACION_ID, ADMIN)
    expect(res.diff).toEqual([])
  })

  it("PARTICIPANTE -> 404 asignacionNoEncontrada (D-S7-D1)", async () => {
    await expect(service.obtenerDiff(ASIGNACION_ID, PARTICIPANTE)).rejects.toMatchObject({
      response: { code: apiErrorCodes.asignacionNoEncontrada },
    })
  })

  it("plan sin snapshot -> 404 planNoEncontrado", async () => {
    prisma.planEstudio.findUnique.mockResolvedValue({
      id: PLAN_ID,
      fechaCalculo: new Date(),
      estaDesactualizado: false,
      fichaSnapshot: null,
      asignacion: { cursoId: CURSO_ID, colaboradorId: COLABORADOR_ID },
    })
    await expect(service.obtenerDiff(ASIGNACION_ID, ADMIN)).rejects.toMatchObject({
      response: { code: apiErrorCodes.planNoEncontrado },
    })
  })

  it("snapshot invalido -> 500 fichaSnapshotInvalida", async () => {
    prisma.planEstudio.findUnique.mockResolvedValue({
      id: PLAN_ID,
      fechaCalculo: new Date(),
      estaDesactualizado: false,
      fichaSnapshot: { foo: "bar" },
      asignacion: { cursoId: CURSO_ID, colaboradorId: COLABORADOR_ID },
    })
    await expect(service.obtenerDiff(ASIGNACION_ID, ADMIN)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    )
  })
})

describe("PlanPersonalService.registrarApertura (P7c)", () => {
  function mockAsignacionActiva(): void {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: EstadoAsignado.EN_PROGRESO,
      estadoVoluntario: null,
    })
    prisma.cursoModuloHabilitado.findFirst.mockResolvedValue({ moduloId: MODULO_ID_1 })
  }

  it("primera apertura -> create + yaEstaba=false", async () => {
    mockAsignacionActiva()
    const fecha = new Date("2026-05-11T12:00:00Z")
    prisma.aperturaSeccion.create.mockResolvedValue({ primeraAperturaAt: fecha })

    const res = await service.registrarApertura(ASIGNACION_ID, SECCION_ID_1, ADMIN)
    expect(res.yaEstaba).toBe(false)
    expect(res.primeraAperturaAt).toBe(fecha.toISOString())
  })

  it("segunda apertura (P2002) -> findUnique + yaEstaba=true con mismo timestamp", async () => {
    mockAsignacionActiva()
    const fecha = new Date("2026-05-11T12:00:00Z")
    prisma.aperturaSeccion.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "test",
      }),
    )
    prisma.aperturaSeccion.findUnique.mockResolvedValue({ primeraAperturaAt: fecha })

    const res = await service.registrarApertura(ASIGNACION_ID, SECCION_ID_1, ADMIN)
    expect(res.yaEstaba).toBe(true)
    expect(res.primeraAperturaAt).toBe(fecha.toISOString())
  })

  it("seccion de otro curso -> 404 seccionNoEncontrada", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: EstadoAsignado.EN_PROGRESO,
      estadoVoluntario: null,
    })
    prisma.cursoModuloHabilitado.findFirst.mockResolvedValue(null)

    await expect(
      service.registrarApertura(ASIGNACION_ID, SECCION_ID_1, ADMIN),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.seccionNoEncontrada },
    })
  })

  it("PARTICIPANTE ajeno -> 404 asignacionNoEncontrada (D-S7-D1)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      cursoId: CURSO_ID,
      colaboradorId: "otro-colab",
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: EstadoAsignado.EN_PROGRESO,
      estadoVoluntario: null,
    })
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })

    await expect(
      service.registrarApertura(ASIGNACION_ID, SECCION_ID_1, PARTICIPANTE),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.asignacionNoEncontrada } })
  })

  it("asignacion en estado terminal APTO -> 409 conflictAsignacionCerrada", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      cursoId: CURSO_ID,
      colaboradorId: COLABORADOR_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: EstadoAsignado.APTO,
      estadoVoluntario: null,
    })

    await expect(
      service.registrarApertura(ASIGNACION_ID, SECCION_ID_1, ADMIN),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictAsignacionCerrada },
    })
  })
})
