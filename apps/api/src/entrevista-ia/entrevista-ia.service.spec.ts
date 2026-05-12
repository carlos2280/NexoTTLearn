import { ConflictException, NotFoundException } from "@nestjs/common"
import { OrigenNotaSkill, Prisma, RolUsuario } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AiService } from "../common/ai/ai.service"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { NotaSkillService } from "../nota-skill/nota-skill.service"
import { EntrevistaIaService } from "./entrevista-ia.service"

/**
 * Spec del service P8c. Mocks de Prisma y dependencias se construyen como
 * `vi.fn()` siguiendo el patron heredado de `transversal.service.spec.ts`.
 * No tocamos BD real; los flujos cubren branches criticas + visibilidad
 * + caminos felices con AiService mock.
 */

const ASIGNACION_ID = "11111111-1111-1111-1111-111111111111"
const CURSO_ID = "22222222-2222-2222-2222-222222222222"
const COLABORADOR_ID = "33333333-3333-3333-3333-333333333333"
const ENTREVISTA_IA_ID = "44444444-4444-4444-4444-444444444444"
const INTENTO_ID = "55555555-5555-5555-5555-555555555555"
const AREA_ID = "66666666-6666-6666-6666-666666666666"
const SKILL_ID = "77777777-7777-7777-7777-777777777777"
const USER_ADMIN_ID = "88888888-8888-8888-8888-888888888888"
const USER_PART_ID = "99999999-9999-9999-9999-999999999999"

const ADMIN_SESION: SesionUsuario = {
  usuarioId: USER_ADMIN_ID,
  rol: RolUsuario.ADMIN,
}
const PART_SESION: SesionUsuario = {
  usuarioId: USER_PART_ID,
  rol: RolUsuario.PARTICIPANTE,
}

interface MockPrisma {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  entrevistaIA: {
    findUniqueOrThrow: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  asignacionCurso: {
    findUnique: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
  }
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  intentoEntrevistaIA: {
    findUnique: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  intentoEntrevistaIASeccionBase: { createMany: ReturnType<typeof vi.fn> }
  intentoEntrevistaIANotaArea: { upsert: ReturnType<typeof vi.fn> }
  skill: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  planEstudio: { findUnique: ReturnType<typeof vi.fn> }
  itemPlan: { findMany: ReturnType<typeof vi.fn> }
  intentoBloque: { findMany: ReturnType<typeof vi.fn> }
  aperturaSeccion: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    curso: { findUnique: vi.fn() },
    entrevistaIA: { findUniqueOrThrow: vi.fn(), findUnique: vi.fn() },
    asignacionCurso: {
      findUnique: vi.fn().mockResolvedValue({
        id: ASIGNACION_ID,
        colaboradorId: COLABORADOR_ID,
        curso: { id: CURSO_ID, entrevistaIaId: ENTREVISTA_IA_ID },
      }),
      findUniqueOrThrow: vi.fn().mockResolvedValue({ colaboradorId: COLABORADOR_ID }),
    },
    usuario: { findUnique: vi.fn().mockResolvedValue({ colaboradorId: COLABORADOR_ID }) },
    intentoEntrevistaIA: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    intentoEntrevistaIASeccionBase: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    intentoEntrevistaIANotaArea: { upsert: vi.fn().mockResolvedValue({}) },
    skill: {
      findMany: vi.fn().mockResolvedValue([{ id: SKILL_ID, areaId: AREA_ID }]),
      findUnique: vi.fn().mockResolvedValue({ areaId: AREA_ID }),
    },
    planEstudio: { findUnique: vi.fn().mockResolvedValue({ id: "plan-1" }) },
    itemPlan: { findMany: vi.fn().mockResolvedValue([]) },
    intentoBloque: { findMany: vi.fn().mockResolvedValue([]) },
    aperturaSeccion: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (fn: (tx: MockPrisma) => Promise<unknown>) => fn(mock)),
  }
  return mock
}

function buildAiMock(): AiService {
  return {
    providerName: "mock",
    resolveModel: vi.fn(),
    evaluarRepoCualitativo: vi.fn(),
    mantenerTurnoComprension: vi.fn(),
    mantenerTurnoEntrevista: vi.fn(),
    iniciarEntrevista: vi.fn().mockResolvedValue({ primeraPregunta: "¿Mock pregunta 1?" }),
    mantenerTurnoEntrevistaIa: vi
      .fn()
      .mockResolvedValue({ respuestaIa: "mock respuesta", finalizado: false }),
    calcularNotasFinalEntrevista: vi.fn().mockResolvedValue({
      notaGlobal: 75,
      notasPorArea: [{ areaId: AREA_ID, nota: 75 }],
    }),
  } as unknown as AiService
}

function buildIdempotencyMock(prisma: MockPrisma): IdempotencyService {
  return {
    runOnce: vi.fn().mockImplementation(async (input) => {
      // El ejecutor recibe el `tx`. En tests sin BD real, le pasamos el mock
      // de Prisma (los mismos metodos que usaria una transaccion).
      const result = await input.ejecutor(prisma as never)
      return { status: result.status, body: result.body, replay: false }
    }),
  } as unknown as IdempotencyService
}

function buildNotaSkillMock(): NotaSkillService {
  return {
    recalcularConFuentes: vi.fn().mockResolvedValue({ notaActual: 75 }),
    obtenerIntentoTransversalVigente: vi.fn(),
    obtenerIntentoEntrevistaVigente: vi.fn(),
    calcularNotaActualSkill: vi.fn(),
  } as unknown as NotaSkillService
}

function buildService(): {
  service: EntrevistaIaService
  prisma: MockPrisma
  ai: AiService
  idempotency: IdempotencyService
  notaSkill: NotaSkillService
} {
  const prisma = buildPrismaMock()
  const ai = buildAiMock()
  const idempotency = buildIdempotencyMock(prisma)
  const notaSkill = buildNotaSkillMock()
  const service = new EntrevistaIaService(
    prisma as unknown as PrismaService,
    idempotency,
    ai,
    notaSkill,
  )
  return { service, prisma, ai, idempotency, notaSkill }
}

const ENTREVISTA_DEF_MOCK = {
  id: ENTREVISTA_IA_ID,
  cursoId: CURSO_ID,
  umbralAprobacion: new Prisma.Decimal(70),
  filosofia: "PREPARACION" as const,
  profundidad: "SEMI_SENIOR" as const,
  duracionMinutos: 30,
  tono: "CONVERSACIONAL" as const,
  rubrica: [{ areaId: AREA_ID, peso: new Prisma.Decimal(100) }],
}

const INTENTO_BASE_MOCK = {
  id: INTENTO_ID,
  entrevistaIaId: ENTREVISTA_IA_ID,
  colaboradorId: COLABORADOR_ID,
  fecha: new Date("2026-05-10T10:00:00Z"),
  notaGlobal: new Prisma.Decimal(0),
  aprobado: false,
  transcripcionOLog: {
    estado: "EN_PROGRESO",
    rubricaSnapshot: {},
    seccionesBaseSnapshot: {},
    turnos: [{ rol: "ASISTENTE", mensaje: "p1", timestamp: "2026-05-10T10:00:00Z" }],
    fechaFinalizacion: null,
  },
  rubricaSnapshot: {},
  notaAjustadaAdmin: null,
  anulado: false,
  motivoAjusteOAnulacion: null,
  notasPorArea: [],
  entrevistaIA: {
    cursoId: CURSO_ID,
    profundidad: "SEMI_SENIOR" as const,
    umbralAprobacion: new Prisma.Decimal(70),
    rubrica: [{ areaId: AREA_ID, peso: new Prisma.Decimal(100) }],
  },
}

describe("E12 GET /cursos/:cursoId/entrevista-ia", () => {
  it("ADMIN: devuelve la definicion", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, entrevistaIaId: ENTREVISTA_IA_ID })
    prisma.entrevistaIA.findUniqueOrThrow.mockResolvedValue(ENTREVISTA_DEF_MOCK)
    const r = await service.obtenerPorCurso(CURSO_ID, ADMIN_SESION)
    expect(r.entrevistaIaId).toBe(ENTREVISTA_IA_ID)
    expect(r.areas).toEqual([{ areaId: AREA_ID, peso: 100 }])
  })

  it("PARTICIPANTE inscrito: recibe la definicion", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, entrevistaIaId: ENTREVISTA_IA_ID })
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({ id: ASIGNACION_ID })
    prisma.entrevistaIA.findUniqueOrThrow.mockResolvedValue(ENTREVISTA_DEF_MOCK)
    const r = await service.obtenerPorCurso(CURSO_ID, PART_SESION)
    expect(r.entrevistaIaId).toBe(ENTREVISTA_IA_ID)
  })

  it("PARTICIPANTE no inscrito: 404", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, entrevistaIaId: ENTREVISTA_IA_ID })
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerPorCurso(CURSO_ID, PART_SESION)).rejects.toThrow(NotFoundException)
  })

  it("curso sin entrevista IA: 404 entrevistaIaNoEncontrada", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, entrevistaIaId: null })
    await expect(service.obtenerPorCurso(CURSO_ID, ADMIN_SESION)).rejects.toThrow(NotFoundException)
  })
})

describe("E13 GET disponibilidad", () => {
  it("ENTREVISTA_IA_NO_CONFIGURADA si el curso no tiene entrevista", async () => {
    const { service, prisma } = buildService()
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      colaboradorId: COLABORADOR_ID,
      curso: { id: CURSO_ID, entrevistaIaId: null },
    })
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN_SESION)
    expect(r.disponible).toBe(false)
    expect(r.razon).toBe("ENTREVISTA_IA_NO_CONFIGURADA")
  })

  it("RATE_LIMIT_HORA cuando hay 5 intentos en la ultima hora", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.count.mockResolvedValue(5)
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN_SESION)
    expect(r.disponible).toBe(false)
    expect(r.razon).toBe("RATE_LIMIT_HORA")
    expect(r.intentosUsadosHoy).toBe(5)
  })

  it("INTENTO_EN_CURSO si existe uno EN_PROGRESO", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findMany.mockResolvedValue([
      {
        id: "i1",
        transcripcionOLog: { estado: "EN_PROGRESO", turnos: [] },
        notasPorArea: [],
      },
    ])
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN_SESION)
    expect(r.disponible).toBe(false)
    expect(r.razon).toBe("INTENTO_EN_CURSO")
  })

  it("PLAN_INCOMPLETO si el plan no esta completo", async () => {
    const { service, prisma } = buildService()
    prisma.planEstudio.findUnique.mockResolvedValue(null)
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN_SESION)
    expect(r.disponible).toBe(false)
    expect(r.razon).toBe("PLAN_INCOMPLETO")
  })

  it("DISPONIBLE happy path", async () => {
    const { service } = buildService()
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN_SESION)
    expect(r.disponible).toBe(true)
    expect(r.razon).toBe("DISPONIBLE")
    expect(r.maxPorHora).toBe(5)
  })
})

describe("E14 POST crear intento (snapshot + idempotency)", () => {
  function setupCrearIntentoHappy(): {
    service: EntrevistaIaService
    prisma: MockPrisma
    ai: AiService
  } {
    const { service, prisma, ai } = buildService()
    prisma.entrevistaIA.findUniqueOrThrow.mockResolvedValue({
      umbralAprobacion: new Prisma.Decimal(70),
      filosofia: "PREPARACION",
      profundidad: "SEMI_SENIOR",
      duracionMinutos: 30,
      tono: "CONVERSACIONAL",
      rubrica: [{ areaId: AREA_ID, peso: new Prisma.Decimal(100) }],
    })
    const seccionUuid = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    const bloqueUuid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    prisma.planEstudio.findUnique.mockResolvedValue({
      id: "plan-1",
      items: [
        {
          seccionId: seccionUuid,
          seccion: {
            id: seccionUuid,
            titulo: "S1",
            modulo: { titulo: "M1" },
            skills: [],
            bloques: [{ id: bloqueUuid, tipo: "PARRAFO", contenido: { titulo: "t1" } }],
          },
        },
      ],
    })
    prisma.aperturaSeccion.findMany.mockResolvedValue([{ seccionId: seccionUuid }])
    prisma.intentoEntrevistaIA.create.mockResolvedValue({ id: INTENTO_ID })
    return { service, prisma, ai }
  }

  it("ADMIN no puede crear intentos (solo PARTICIPANTE)", async () => {
    const { service } = setupCrearIntentoHappy()
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        idempotencyKey: "key-1",
        usuario: ADMIN_SESION,
      }),
    ).rejects.toThrow()
  })

  it("ENTREVISTA_IA_NO_CONFIGURADA si el curso no tiene entrevista", async () => {
    const { service, prisma } = setupCrearIntentoHappy()
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      colaboradorId: COLABORADOR_ID,
      curso: { id: CURSO_ID, entrevistaIaId: null },
    })
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        idempotencyKey: "key-1",
        usuario: PART_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("RATE_LIMIT cuando hay >= 5 intentos en la ultima hora", async () => {
    const { service, prisma } = setupCrearIntentoHappy()
    prisma.intentoEntrevistaIA.count.mockResolvedValue(5)
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        idempotencyKey: "key-1",
        usuario: PART_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("INTENTO_EN_CURSO si hay otro EN_PROGRESO", async () => {
    const { service, prisma } = setupCrearIntentoHappy()
    prisma.intentoEntrevistaIA.findMany.mockResolvedValue([
      {
        id: "i1",
        transcripcionOLog: { estado: "EN_PROGRESO", turnos: [] },
        notasPorArea: [],
      },
    ])
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        idempotencyKey: "key-1",
        usuario: PART_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("PLAN_INCOMPLETO_PARA_ENTREVISTA si plan no completo", async () => {
    const { service, prisma } = setupCrearIntentoHappy()
    prisma.planEstudio.findUnique.mockReset()
    prisma.planEstudio.findUnique.mockResolvedValue(null)
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        idempotencyKey: "key-1",
        usuario: PART_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("happy path: crea intento con snapshot + primera pregunta de la IA", async () => {
    const { service, ai } = setupCrearIntentoHappy()
    const r = await service.crearIntento({
      asignacionId: ASIGNACION_ID,
      idempotencyKey: "key-1",
      usuario: PART_SESION,
    })
    expect(r.intentoId).toBe(INTENTO_ID)
    expect(r.primeraPregunta).toBe("¿Mock pregunta 1?")
    expect(ai.iniciarEntrevista).toHaveBeenCalledOnce()
  })
})

describe("E15 POST turno", () => {
  it("404 si el intento no existe", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue(null)
    await expect(
      service.enviarTurno({
        intentoId: INTENTO_ID,
        body: { mensaje: "hola" },
        usuario: PART_SESION,
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it("409 si el intento esta cerrado (FINALIZADO)", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      ...INTENTO_BASE_MOCK,
      notasPorArea: [{ areaId: AREA_ID, nota: new Prisma.Decimal(80) }],
    })
    await expect(
      service.enviarTurno({
        intentoId: INTENTO_ID,
        body: { mensaje: "hola" },
        usuario: PART_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("happy path saneando chars de control + respuesta IA", async () => {
    const { service, prisma, ai } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue(INTENTO_BASE_MOCK)
    const r = await service.enviarTurno({
      intentoId: INTENTO_ID,
      body: { mensaje: "mensajevalido" },
      usuario: PART_SESION,
    })
    expect(r.respuestaIa).toBe("mock respuesta")
    expect(r.finalizado).toBe(false)
    expect(ai.mantenerTurnoEntrevistaIa).toHaveBeenCalledOnce()
  })

  it("finalizado=true se propaga al cliente", async () => {
    const { service, prisma, ai } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue(INTENTO_BASE_MOCK)
    ;(ai.mantenerTurnoEntrevistaIa as ReturnType<typeof vi.fn>).mockResolvedValue({
      respuestaIa: "cierre amable",
      finalizado: true,
    })
    const r = await service.enviarTurno({
      intentoId: INTENTO_ID,
      body: { mensaje: "ultima respuesta" },
      usuario: PART_SESION,
    })
    expect(r.finalizado).toBe(true)
    expect(r.siguientePregunta).toBeNull()
  })
})

describe("E16 POST finalizar (cierre + replicacion D33)", () => {
  it("happy: persiste notas + invoca NotaSkill.recalcular por cada skill", async () => {
    const { service, prisma, notaSkill } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue(INTENTO_BASE_MOCK)
    const r = await service.finalizar({ intentoId: INTENTO_ID, usuario: ADMIN_SESION })
    expect(r.notaGlobal).toBe(75)
    expect(r.aprobado).toBe(true)
    expect(r.skillsActualizadas).toEqual([SKILL_ID])
    expect(notaSkill.recalcularConFuentes).toHaveBeenCalled()
    const args = (notaSkill.recalcularConFuentes as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as
      | { origen: OrigenNotaSkill }
      | undefined
    expect(args?.origen).toBe(OrigenNotaSkill.ENTREVISTA_IA)
  })

  it("409 si el intento no esta EN_PROGRESO", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      ...INTENTO_BASE_MOCK,
      notasPorArea: [{ areaId: AREA_ID, nota: new Prisma.Decimal(80) }],
    })
    await expect(
      service.finalizar({ intentoId: INTENTO_ID, usuario: ADMIN_SESION }),
    ).rejects.toThrow(ConflictException)
  })
})

describe("E17 visibilidad campo-a-campo (admin vs participante)", () => {
  it("PARTICIPANTE no recibe motivoAjuste/notaAjustadaAdmin", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      ...INTENTO_BASE_MOCK,
      anulado: true,
      motivoAjusteOAnulacion: "motivo confidencial",
      notaAjustadaAdmin: new Prisma.Decimal(95),
    })
    const r = await service.obtenerIntento(INTENTO_ID, PART_SESION)
    expect("motivoAjusteOAnulacion" in r).toBe(false)
    expect("notaAjustadaAdmin" in r).toBe(false)
  })

  it("ADMIN ve todos los campos sensibles", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      ...INTENTO_BASE_MOCK,
      anulado: true,
      motivoAjusteOAnulacion: "motivo admin",
      notaAjustadaAdmin: new Prisma.Decimal(95),
    })
    const r = await service.obtenerIntento(INTENTO_ID, ADMIN_SESION)
    expect("motivoAjusteOAnulacion" in r).toBe(true)
    expect("notaAjustadaAdmin" in r).toBe(true)
  })
})

describe("E18 listar intentos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("paginado fecha DESC para admin", async () => {
    const { service, prisma } = buildService()
    prisma.$transaction.mockResolvedValue([[INTENTO_BASE_MOCK], 1])
    const r = await service.listarIntentos({
      asignacionId: ASIGNACION_ID,
      query: { page: 1, pageSize: 20 },
      usuario: ADMIN_SESION,
    })
    expect(r.meta.total).toBe(1)
    expect(r.data).toHaveLength(1)
  })
})

describe("E19 ajustar (admin + X-Motivo + recalculo)", () => {
  it("happy: usa notaAjustadaAdmin en el recalculo", async () => {
    const { service, prisma, notaSkill } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      ...INTENTO_BASE_MOCK,
      notasPorArea: [{ areaId: AREA_ID, nota: new Prisma.Decimal(80) }],
    })
    const r = await service.ajustar({
      intentoId: INTENTO_ID,
      notaAjustada: 95,
      motivo: "Re-evaluacion manual",
      usuario: ADMIN_SESION,
    })
    expect(r.notaAjustadaAdmin).toBe(95)
    expect(notaSkill.recalcularConFuentes).toHaveBeenCalled()
    const ref = (notaSkill.recalcularConFuentes as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as
      | { referencia: { evento: string; motivoLength: number } }
      | undefined
    expect(ref?.referencia.evento).toBe("AJUSTADO")
    expect(ref?.referencia.motivoLength).toBe("Re-evaluacion manual".length)
  })

  it("409 si el intento no esta FINALIZADO", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue(INTENTO_BASE_MOCK)
    await expect(
      service.ajustar({
        intentoId: INTENTO_ID,
        notaAjustada: 80,
        motivo: "x",
        usuario: ADMIN_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("409 si el intento esta anulado", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      ...INTENTO_BASE_MOCK,
      anulado: true,
    })
    await expect(
      service.ajustar({
        intentoId: INTENTO_ID,
        notaAjustada: 80,
        motivo: "x",
        usuario: ADMIN_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })
})

describe("E20 anular (runOnce + audit no-replay)", () => {
  it("happy: marca anulado y recalcula skills", async () => {
    const { service, prisma, notaSkill, idempotency } = buildService()
    // El runOnce mock ejecuta inmediatamente el ejecutor. Para anular el
    // service hace tx.intentoEntrevistaIA.findUnique dentro del ejecutor.
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      id: INTENTO_ID,
      anulado: false,
      colaboradorId: COLABORADOR_ID,
      entrevistaIA: {
        cursoId: CURSO_ID,
        rubrica: [{ areaId: AREA_ID }],
      },
    })
    const { response, replay } = await service.anular({
      intentoId: INTENTO_ID,
      motivo: "evaluacion defectuosa",
      idempotencyKey: "uuid-key",
      usuario: ADMIN_SESION,
    })
    expect(response.intentoId).toBe(INTENTO_ID)
    expect(response.anulado).toBe(true)
    expect(replay).toBe(false)
    expect(notaSkill.recalcularConFuentes).toHaveBeenCalled()
    expect(idempotency.runOnce).toHaveBeenCalledOnce()
  })

  it("409 si ya esta anulado (race)", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      id: INTENTO_ID,
      anulado: true,
      colaboradorId: COLABORADOR_ID,
      entrevistaIA: { cursoId: CURSO_ID, rubrica: [{ areaId: AREA_ID }] },
    })
    await expect(
      service.anular({
        intentoId: INTENTO_ID,
        motivo: "x",
        idempotencyKey: "uuid-key",
        usuario: ADMIN_SESION,
      }),
    ).rejects.toThrow(ConflictException)
  })

  it("replay devuelve la respuesta cacheada sin volver a invocar el ejecutor", async () => {
    const { service, idempotency } = buildService()
    ;(idempotency.runOnce as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      body: {
        intentoId: INTENTO_ID,
        anulado: true,
        skillsRecalculadas: [SKILL_ID],
      },
      replay: true,
    })
    const { replay, response } = await service.anular({
      intentoId: INTENTO_ID,
      motivo: "x",
      idempotencyKey: "uuid-key",
      usuario: ADMIN_SESION,
    })
    expect(replay).toBe(true)
    expect(response.intentoId).toBe(INTENTO_ID)
  })
})

describe("Visibilidad PARTICIPANTE ajeno -> 404 (D-AS-9)", () => {
  it("PARTICIPANTE sobre intento de otro colaborador -> 404", async () => {
    const { service, prisma } = buildService()
    prisma.intentoEntrevistaIA.findUnique.mockResolvedValue({
      ...INTENTO_BASE_MOCK,
      colaboradorId: "otro-colaborador",
    })
    await expect(service.obtenerIntento(INTENTO_ID, PART_SESION)).rejects.toThrow(NotFoundException)
  })
})
