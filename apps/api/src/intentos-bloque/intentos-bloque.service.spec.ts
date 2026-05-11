import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import {
  EstadoAsignado,
  EstadoCurso,
  EstadoVoluntario,
  Prisma,
  RolAsignacion,
  RolUsuario,
} from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import type { SesionUsuario } from "../common/types/sesion.types"
import { IntentosBloqueService } from "./intentos-bloque.service"

const COLABORADOR_ID = "f0000000-0000-0000-0000-000000000001"
const COLABORADOR_AJENO_ID = "f0000000-0000-0000-0000-000000000099"
const USUARIO_ID = "9000000a-0000-0000-0000-000000000001"
const CURSO_ID = "c0000000-0000-0000-0000-000000000001"
const SECCION_ID = "22222222-2222-2222-2222-222222222221"
const MODULO_ID = "11111111-1111-1111-1111-111111111110"
const BLOQUE_ID = "b0000000-0000-0000-0000-000000000001"
const SKILL_ID = "31111111-1111-1111-1111-111111111111"
const ASIGNACION_ID = "a0000000-0000-0000-0000-000000000001"
const INTENTO_ID = "10000000-0000-0000-0000-000000000001"
const IDEMPOTENCY_KEY = "4f97e2b6-9b5a-4c5a-9c5a-9b5a4c5a9b5a"

const PARTICIPANTE: SesionUsuario = { usuarioId: USUARIO_ID, rol: RolUsuario.PARTICIPANTE }
const ADMIN: SesionUsuario = { usuarioId: USUARIO_ID, rol: RolUsuario.ADMIN }

const CONTENIDO_QUIZ_OK = {
  preguntas: [
    {
      id: "p1",
      enunciado: "1+1?",
      opciones: [
        { id: "o1", texto: "1" },
        { id: "o2", texto: "2" },
      ],
      respuestaCorrectaId: "o2",
      pesoPunto: 1,
    },
    {
      id: "p2",
      enunciado: "2+2?",
      opciones: [
        { id: "o3", texto: "3" },
        { id: "o4", texto: "4" },
      ],
      respuestaCorrectaId: "o4",
      pesoPunto: 1,
    },
    {
      id: "p3",
      enunciado: "3+3?",
      opciones: [
        { id: "o5", texto: "5" },
        { id: "o6", texto: "6" },
      ],
      respuestaCorrectaId: "o6",
      pesoPunto: 2,
    },
  ],
}

const RESPUESTAS_TODAS_CORRECTAS = {
  preguntas: [
    { preguntaId: "p1", opcionElegidaId: "o2" },
    { preguntaId: "p2", opcionElegidaId: "o4" },
    { preguntaId: "p3", opcionElegidaId: "o6" },
  ],
}

const RESPUESTAS_NINGUNA = {
  preguntas: [
    { preguntaId: "p1", opcionElegidaId: "o1" },
    { preguntaId: "p2", opcionElegidaId: "o3" },
    { preguntaId: "p3", opcionElegidaId: "o5" },
  ],
}

const RESPUESTAS_DOS_DE_TRES_CON_PESOS = {
  preguntas: [
    { preguntaId: "p1", opcionElegidaId: "o2" },
    { preguntaId: "p2", opcionElegidaId: "o3" },
    { preguntaId: "p3", opcionElegidaId: "o6" },
  ],
}

interface MockPrisma {
  bloque: { findUnique: ReturnType<typeof vi.fn> }
  curso: { findUnique: ReturnType<typeof vi.fn> }
  seccion: { findUnique: ReturnType<typeof vi.fn> }
  cursoModuloHabilitado: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: {
    findUnique: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  intentoBloque: {
    create: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  notaSkill: { upsert: ReturnType<typeof vi.fn> }
  historicoNotaSkill: { create: ReturnType<typeof vi.fn> }
  historicoEstadoAsignacion: { create: ReturnType<typeof vi.fn> }
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    bloque: { findUnique: vi.fn() },
    curso: { findUnique: vi.fn() },
    seccion: { findUnique: vi.fn() },
    cursoModuloHabilitado: { findUnique: vi.fn() },
    asignacionCurso: {
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    intentoBloque: {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    notaSkill: {
      upsert: vi.fn().mockResolvedValue({ id: "ns-1" }),
    },
    historicoNotaSkill: { create: vi.fn().mockResolvedValue({}) },
    historicoEstadoAsignacion: { create: vi.fn().mockResolvedValue({}) },
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

function makeIntento(
  overrides: Partial<{
    id: string
    nota: number
    esMejorIntento: boolean
    estaInvalidado: boolean
  }> = {},
) {
  return {
    id: overrides.id ?? INTENTO_ID,
    bloqueId: BLOQUE_ID,
    skillId: SKILL_ID,
    cursoId: CURSO_ID,
    colaboradorId: COLABORADOR_ID,
    nota: new Prisma.Decimal(overrides.nota ?? 100),
    esMejorIntento: overrides.esMejorIntento ?? false,
    versionBloque: 1,
    estaInvalidado: overrides.estaInvalidado ?? false,
    fecha: new Date("2026-05-11T10:00:00Z"),
  }
}

function configurarBloqueOk(prisma: MockPrisma): void {
  prisma.bloque.findUnique.mockResolvedValue({
    id: BLOQUE_ID,
    seccionId: SECCION_ID,
    tipo: "QUIZ",
    esEvaluable: true,
    skillQueMideId: SKILL_ID,
    estado: "ACTIVO",
    version: 1,
    contenido: CONTENIDO_QUIZ_OK,
  })
  prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.ACTIVO })
  prisma.seccion.findUnique.mockResolvedValue({ id: SECCION_ID, moduloId: MODULO_ID })
  prisma.cursoModuloHabilitado.findUnique.mockResolvedValue({ cursoId: CURSO_ID })
  prisma.asignacionCurso.findUnique.mockResolvedValue({
    id: ASIGNACION_ID,
    rol: RolAsignacion.ASIGNADO,
    estadoAsignado: EstadoAsignado.ASIGNADO,
    estadoVoluntario: null,
  })
  prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
}

let prisma: MockPrisma
let idempotency: { runOnce: ReturnType<typeof vi.fn> }
let service: IntentosBloqueService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  idempotency = {
    runOnce: vi.fn(
      async (input: { ejecutor: (tx: unknown) => Promise<{ status: number; body: unknown }> }) => {
        const r = await input.ejecutor(prisma)
        return { status: r.status, body: r.body, replay: false }
      },
    ),
  }
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: IntentosBloqueService,
        useFactory: (p: PrismaService, i: IdempotencyService) => new IntentosBloqueService(p, i),
        inject: [PrismaService, IdempotencyService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: IdempotencyService, useValue: idempotency },
    ],
  }).compile()
  service = moduleRef.get(IntentosBloqueService)
})

// =============================================================================
// Algoritmo QUIZ (D-S7-C2)
// =============================================================================

describe("IntentosBloqueService.crear — algoritmo QUIZ", () => {
  it("3/3 correctas con pesos (1,1,2) -> nota 100", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 100 }))
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 100, esMejorIntento: true }),
    )
    const resultado = await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    expect(resultado.body.nota).toBe(100)
    expect(prisma.intentoBloque.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nota: expect.any(Prisma.Decimal),
        }),
      }),
    )
  })

  it("0/3 -> nota 0", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 0 }))
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 0, esMejorIntento: true }),
    )
    const resultado = await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_NINGUNA },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    expect(resultado.body.nota).toBe(0)
  })

  it("calculo ponderado: 1 + 0 + 2 sobre 4 puntos totales -> 75", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 75 }))
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 75, esMejorIntento: true }),
    )
    await service.crear({
      body: {
        bloqueId: BLOQUE_ID,
        cursoId: CURSO_ID,
        respuestas: RESPUESTAS_DOS_DE_TRES_CON_PESOS,
      },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    // Capturamos el data pasado al create para verificar la nota calculada.
    const callArgs = prisma.intentoBloque.create.mock.calls[0]?.[0] as {
      data: { nota: Prisma.Decimal }
    }
    expect(Number(callArgs.data.nota.toString())).toBeCloseTo(75, 2)
  })

  it("contenido con shape invalido -> 500 contenidoBloqueInvalido", async () => {
    configurarBloqueOk(prisma)
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLOQUE_ID,
      seccionId: SECCION_ID,
      tipo: "QUIZ",
      esEvaluable: true,
      skillQueMideId: SKILL_ID,
      estado: "ACTIVO",
      version: 1,
      contenido: { malformed: true },
    })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })
})

// =============================================================================
// Validaciones de entrada
// =============================================================================

describe("IntentosBloqueService.crear — validaciones", () => {
  it("404 bloqueNoEncontrado cuando bloque inexistente", async () => {
    configurarBloqueOk(prisma)
    prisma.bloque.findUnique.mockResolvedValue(null)
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("409 bloqueNoEvaluable cuando esEvaluable=false", async () => {
    configurarBloqueOk(prisma)
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLOQUE_ID,
      seccionId: SECCION_ID,
      tipo: "QUIZ",
      esEvaluable: false,
      skillQueMideId: SKILL_ID,
      estado: "ACTIVO",
      version: 1,
      contenido: CONTENIDO_QUIZ_OK,
    })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("422 tipoBloqueNoSoportadoMvp para CODIGO_PREGUNTAS", async () => {
    configurarBloqueOk(prisma)
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLOQUE_ID,
      seccionId: SECCION_ID,
      tipo: "CODIGO_PREGUNTAS",
      esEvaluable: true,
      skillQueMideId: SKILL_ID,
      estado: "ACTIVO",
      version: 1,
      contenido: CONTENIDO_QUIZ_OK,
    })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toMatchObject({
      response: {
        code: apiErrorCodes.tipoBloqueNoSoportadoMvp,
        details: { tipoActual: "CODIGO_PREGUNTAS" },
      },
    })
  })

  it("409 bloqueSinSkillMedida cuando skillQueMideId es null", async () => {
    configurarBloqueOk(prisma)
    prisma.bloque.findUnique.mockResolvedValue({
      id: BLOQUE_ID,
      seccionId: SECCION_ID,
      tipo: "QUIZ",
      esEvaluable: true,
      skillQueMideId: null,
      estado: "ACTIVO",
      version: 1,
      contenido: CONTENIDO_QUIZ_OK,
    })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.bloqueSinSkillMedida },
    })
  })

  it("409 conflictCursoNoActivo cuando curso no ACTIVO", async () => {
    configurarBloqueOk(prisma)
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.BORRADOR })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoNoActivo },
    })
  })

  it("404 bloqueNoEncontrado cuando el modulo no esta habilitado para el curso", async () => {
    configurarBloqueOk(prisma)
    prisma.cursoModuloHabilitado.findUnique.mockResolvedValue(null)
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("404 asignacionNoEncontrada cuando no hay asignacion", async () => {
    configurarBloqueOk(prisma)
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.asignacionNoEncontrada },
    })
  })

  it("409 conflictAsignacionCerrada para ASIGNADO en estado APTO", async () => {
    configurarBloqueOk(prisma)
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: EstadoAsignado.APTO,
      estadoVoluntario: null,
    })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictAsignacionCerrada },
    })
  })

  it("409 conflictAsignacionCerrada para VOLUNTARIO en estado COMPLETADO", async () => {
    configurarBloqueOk(prisma)
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoAsignado: null,
      estadoVoluntario: EstadoVoluntario.COMPLETADO,
    })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("404 cuando el usuario no tiene colaborador asociado", async () => {
    configurarBloqueOk(prisma)
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: null })
    await expect(
      service.crear({
        body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: PARTICIPANTE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

// =============================================================================
// Mejor intento + NotaSkill + Transicion
// =============================================================================

describe("IntentosBloqueService.crear — mejor intento y NotaSkill", () => {
  it("primer intento queda como esMejorIntento=true", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 80 }))
    prisma.intentoBloque.findFirst.mockResolvedValue(null) // no hay mejor previo
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 80, esMejorIntento: true }),
    )
    await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    expect(prisma.intentoBloque.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { esMejorIntento: true } }),
    )
  })

  it("nuevo intento con nota mayor revierte el mejor anterior", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 100, id: "nuevo" }))
    prisma.intentoBloque.findFirst.mockResolvedValueOnce({
      id: "anterior",
      nota: new Prisma.Decimal(50),
    })
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 100, esMejorIntento: true, id: "nuevo" }),
    )
    await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    const updates = prisma.intentoBloque.update.mock.calls.map((c) => c[0])
    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ where: { id: "anterior" }, data: { esMejorIntento: false } }),
        expect.objectContaining({ where: { id: "nuevo" }, data: { esMejorIntento: true } }),
      ]),
    )
  })

  it("nuevo intento con nota menor no toca el mejor anterior", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 30, id: "nuevo" }))
    prisma.intentoBloque.findFirst.mockResolvedValueOnce({
      id: "anterior",
      nota: new Prisma.Decimal(80),
    })
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 30, esMejorIntento: false, id: "nuevo" }),
    )
    await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_NINGUNA },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    // No debe haber `data: { esMejorIntento: true }` ni `false` para el nuevo intento.
    const updates = prisma.intentoBloque.update.mock.calls.map((c) => c[0])
    expect(updates).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ where: { id: "nuevo" }, data: { esMejorIntento: true } }),
      ]),
    )
  })

  it("upsert de NotaSkill con promedio sobre mejores vigentes", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 100, id: "nuevo" }))
    prisma.intentoBloque.findFirst.mockResolvedValue(null)
    prisma.intentoBloque.findMany.mockResolvedValue([
      { nota: new Prisma.Decimal(80) },
      { nota: new Prisma.Decimal(100) },
    ])
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 100, esMejorIntento: true }),
    )
    await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    expect(prisma.notaSkill.upsert).toHaveBeenCalled()
    expect(prisma.historicoNotaSkill.create).toHaveBeenCalled()
  })
})

describe("IntentosBloqueService.crear — transicion automatica", () => {
  it("asignacion ASIGNADO:ASIGNADO -> EN_PROGRESO crea historico", async () => {
    configurarBloqueOk(prisma)
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 100 }))
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 100, esMejorIntento: true }),
    )
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estadoAnterior: "ASIGNADO:ASIGNADO",
          estadoNuevo: "ASIGNADO:EN_PROGRESO",
          motivo: "TRANSICION_AUTOMATICA_POR_INTENTO",
        }),
      }),
    )
  })

  it("asignacion EN_PROGRESO -> updateMany count=0, sin historico nuevo", async () => {
    configurarBloqueOk(prisma)
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: EstadoAsignado.EN_PROGRESO,
      estadoVoluntario: null,
    })
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 100 }))
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 100, esMejorIntento: true }),
    )
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 0 })
    await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    expect(prisma.historicoEstadoAsignacion.create).not.toHaveBeenCalled()
  })

  it("asignacion VOLUNTARIO:INSCRITO -> EN_PROGRESO crea historico", async () => {
    configurarBloqueOk(prisma)
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoAsignado: null,
      estadoVoluntario: EstadoVoluntario.INSCRITO,
    })
    prisma.intentoBloque.create.mockResolvedValue(makeIntento({ nota: 100 }))
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(
      makeIntento({ nota: 100, esMejorIntento: true }),
    )
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    await service.crear({
      body: { bloqueId: BLOQUE_ID, cursoId: CURSO_ID, respuestas: RESPUESTAS_TODAS_CORRECTAS },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: PARTICIPANTE,
    })
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estadoAnterior: "VOLUNTARIO:INSCRITO",
          estadoNuevo: "VOLUNTARIO:EN_PROGRESO",
        }),
      }),
    )
  })
})

// =============================================================================
// Invalidacion
// =============================================================================

describe("IntentosBloqueService.invalidar", () => {
  it("404 cuando intento inexistente", async () => {
    prisma.intentoBloque.findUnique.mockResolvedValue(null)
    await expect(
      service.invalidar({ intentoId: INTENTO_ID, motivo: "razon ok" }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("409 conflictIntentoYaInvalidado cuando ya invalidado", async () => {
    prisma.intentoBloque.findUnique.mockResolvedValue({
      id: INTENTO_ID,
      colaboradorId: COLABORADOR_ID,
      bloqueId: BLOQUE_ID,
      esMejorIntento: false,
      estaInvalidado: true,
      bloque: { skillQueMideId: SKILL_ID, version: 1 },
    })
    await expect(
      service.invalidar({ intentoId: INTENTO_ID, motivo: "razon ok" }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictIntentoYaInvalidado },
    })
  })

  it("400 motivoRequerido cuando motivo vacio", async () => {
    await expect(service.invalidar({ intentoId: INTENTO_ID, motivo: "  " })).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })

  it("invalidar mejor intento promueve el siguiente vigente y recalcula NotaSkill", async () => {
    prisma.intentoBloque.findUnique.mockResolvedValue({
      id: INTENTO_ID,
      colaboradorId: COLABORADOR_ID,
      bloqueId: BLOQUE_ID,
      esMejorIntento: true,
      estaInvalidado: false,
      bloque: { skillQueMideId: SKILL_ID, version: 1 },
    })
    prisma.intentoBloque.findFirst.mockResolvedValue({ id: "siguiente" })
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(makeIntento({ estaInvalidado: true }))
    await service.invalidar({ intentoId: INTENTO_ID, motivo: "ajuste manual" })
    const updates = prisma.intentoBloque.update.mock.calls.map((c) => c[0])
    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          where: { id: INTENTO_ID },
          data: { estaInvalidado: true, esMejorIntento: false },
        }),
        expect.objectContaining({
          where: { id: "siguiente" },
          data: { esMejorIntento: true },
        }),
      ]),
    )
    expect(prisma.notaSkill.upsert).toHaveBeenCalled()
  })

  it("invalidar mejor intento sin otros vigentes -> NotaSkill.notaActual=null", async () => {
    prisma.intentoBloque.findUnique.mockResolvedValue({
      id: INTENTO_ID,
      colaboradorId: COLABORADOR_ID,
      bloqueId: BLOQUE_ID,
      esMejorIntento: true,
      estaInvalidado: false,
      bloque: { skillQueMideId: SKILL_ID, version: 1 },
    })
    prisma.intentoBloque.findFirst.mockResolvedValue(null) // no hay otros
    prisma.intentoBloque.findMany.mockResolvedValue([])
    prisma.intentoBloque.findUniqueOrThrow.mockResolvedValue(makeIntento({ estaInvalidado: true }))
    await service.invalidar({ intentoId: INTENTO_ID, motivo: "ajuste manual" })
    expect(prisma.notaSkill.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ notaActual: null }),
      }),
    )
  })
})

// =============================================================================
// Scope D-S7-D1 (PARTICIPANTE ajeno -> 404)
// =============================================================================

describe("IntentosBloqueService — visibilidad y scope", () => {
  it("PARTICIPANTE ajeno -> 404 al listar intentos", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    await expect(
      service.listarPorColaboradorYBloque({
        colaboradorId: COLABORADOR_AJENO_ID,
        bloqueId: BLOQUE_ID,
        query: { page: 1, pageSize: 20, incluirInvalidados: false },
        usuario: PARTICIPANTE,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("PARTICIPANTE propio ignora incluirInvalidados=true (siempre filtra)", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    await service.listarPorColaboradorYBloque({
      colaboradorId: COLABORADOR_ID,
      bloqueId: BLOQUE_ID,
      query: { page: 1, pageSize: 20, incluirInvalidados: true },
      usuario: PARTICIPANTE,
    })
    expect(prisma.intentoBloque.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estaInvalidado: false }),
      }),
    )
  })

  it("ADMIN respeta incluirInvalidados=true (sin filtro estaInvalidado)", async () => {
    await service.listarPorColaboradorYBloque({
      colaboradorId: COLABORADOR_ID,
      bloqueId: BLOQUE_ID,
      query: { page: 1, pageSize: 20, incluirInvalidados: true },
      usuario: ADMIN,
    })
    const whereArg = prisma.intentoBloque.findMany.mock.calls[0]?.[0] as {
      where: Record<string, unknown>
    }
    expect(whereArg.where).not.toHaveProperty("estaInvalidado")
  })

  it("obtenerMejorIntento devuelve null cuando no hay vigentes", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    prisma.intentoBloque.findFirst.mockResolvedValue(null)
    const r = await service.obtenerMejorIntento({
      colaboradorId: COLABORADOR_ID,
      bloqueId: BLOQUE_ID,
      usuario: PARTICIPANTE,
    })
    expect(r).toBeNull()
  })
})
