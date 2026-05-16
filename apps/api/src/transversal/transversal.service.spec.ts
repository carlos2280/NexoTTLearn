import { ConflictException, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import {
  DesbloqueoCurso,
  EstadoAsignado,
  EstadoCurso,
  Prisma,
  RolAsignacion,
  RolUsuario,
} from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import type { IdempotencyService } from "../common/idempotency/idempotency.service"
import type { PrismaService } from "../common/prisma/prisma.service"
import type { SesionUsuario } from "../common/types/sesion.types"
import type { NotaSkillService } from "../nota-skill/nota-skill.service"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import type { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import { TransversalCapasService } from "./transversal-capas.service"
import { TransversalService } from "./transversal.service"

const USUARIO_ID = "9000000a-0000-0000-0000-000000000001"
const COLABORADOR_ID = "f0000000-0000-0000-0000-000000000001"
const COLABORADOR_AJENO = "f0000000-0000-0000-0000-000000000099"
const ASIGNACION_ID = "a0000000-0000-0000-0000-000000000001"
const CURSO_ID = "c0000000-0000-0000-0000-000000000001"
const TRANSVERSAL_ID = "12222222-2222-2222-2222-222222222222"
const INTENTO_ID = "10000000-0000-0000-0000-000000000001"
const SKILL_ID = "31111111-1111-1111-1111-111111111111"
const IDEMPOTENCY_KEY = "4f97e2b6-9b5a-4c5a-9c5a-9b5a4c5a9b5a"
const REPO_URL = "https://github.com/foo/bar"

const ADMIN: SesionUsuario = { usuarioId: USUARIO_ID, rol: RolUsuario.ADMIN }
const PARTICIPANTE: SesionUsuario = { usuarioId: USUARIO_ID, rol: RolUsuario.PARTICIPANTE }

interface PrismaMock {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  proyectoTransversal: { findUniqueOrThrow: ReturnType<typeof vi.fn> }
  asignacionCurso: { findUnique: ReturnType<typeof vi.fn> }
  intentoTransversal: {
    findUnique: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  transversalSkill: {
    deleteMany: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
  }
  skill: { findMany: ReturnType<typeof vi.fn> }
  cursoSkillExigida: { findMany: ReturnType<typeof vi.fn> }
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  planEstudio: { findUnique: ReturnType<typeof vi.fn> }
  itemPlan: { findMany: ReturnType<typeof vi.fn> }
  intentoBloque: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    curso: { findUnique: vi.fn() },
    proyectoTransversal: { findUniqueOrThrow: vi.fn() },
    asignacionCurso: { findUnique: vi.fn() },
    intentoTransversal: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    transversalSkill: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    skill: { findMany: vi.fn().mockResolvedValue([]) },
    cursoSkillExigida: { findMany: vi.fn().mockResolvedValue([]) },
    usuario: { findUnique: vi.fn() },
    planEstudio: { findUnique: vi.fn() },
    itemPlan: { findMany: vi.fn().mockResolvedValue([]) },
    intentoBloque: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(
    (arg: ((tx: PrismaMock) => Promise<unknown>) | readonly Promise<unknown>[]) => {
      if (typeof arg === "function") {
        return arg(mock)
      }
      return Promise.all(arg)
    },
  )
  return mock
}

function configurarAsignacion(
  prisma: PrismaMock,
  overrides: Partial<{
    desbloqueo: DesbloqueoCurso
    fechaDesbloqueo: Date | null
    cursoEstado: EstadoCurso
    estadoAsignado: EstadoAsignado
    transversalId: string | null
    entrevistaIaId: string | null
    colaboradorId: string
  }> = {},
): void {
  prisma.asignacionCurso.findUnique.mockResolvedValue({
    id: ASIGNACION_ID,
    colaboradorId: overrides.colaboradorId ?? COLABORADOR_ID,
    cursoId: CURSO_ID,
    rol: RolAsignacion.ASIGNADO,
    estadoAsignado: overrides.estadoAsignado ?? EstadoAsignado.EN_PROGRESO,
    estadoVoluntario: null,
    curso: {
      id: CURSO_ID,
      estado: overrides.cursoEstado ?? EstadoCurso.ACTIVO,
      desbloqueo: overrides.desbloqueo ?? DesbloqueoCurso.SIEMPRE,
      fechaDesbloqueo: overrides.fechaDesbloqueo ?? null,
      transversalId:
        overrides.transversalId === undefined ? TRANSVERSAL_ID : overrides.transversalId,
      entrevistaIaId: overrides.entrevistaIaId ?? null,
    },
  })
  prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
}

let prisma: PrismaMock
let idempotency: { runOnce: ReturnType<typeof vi.fn> }
let job: { dispatch: ReturnType<typeof vi.fn> }
let notaSkill: {
  recalcularConFuentes: ReturnType<typeof vi.fn>
  obtenerIntentoTransversalVigente: ReturnType<typeof vi.fn>
  calcularNotaActualSkill: ReturnType<typeof vi.fn>
}
let notificaciones: { crear: ReturnType<typeof vi.fn> }
let capas: TransversalCapasService
let service: TransversalService

beforeEach(() => {
  prisma = buildPrismaMock()
  idempotency = {
    runOnce: vi.fn(
      async (input: { ejecutor: (tx: unknown) => Promise<{ status: number; body: unknown }> }) => {
        const r = await input.ejecutor(prisma)
        return { status: r.status, body: r.body, replay: false }
      },
    ),
  }
  job = { dispatch: vi.fn() }
  notaSkill = {
    recalcularConFuentes: vi.fn(async () => ({ notaActual: 80 })),
    obtenerIntentoTransversalVigente: vi.fn(() => null),
    calcularNotaActualSkill: vi.fn(() => 80),
  }
  notificaciones = {
    crear: vi.fn().mockResolvedValue({
      creada: true,
      notificacionId: "n-mock",
      canalesEnviados: ["IN_APP"],
    }),
  }
  capas = new TransversalCapasService(idempotency as unknown as IdempotencyService)
  service = new TransversalService(
    prisma as unknown as PrismaService,
    idempotency as unknown as IdempotencyService,
    notaSkill as unknown as NotaSkillService,
    job as unknown as JobEvaluacionTransversalService,
    notificaciones as unknown as NotificacionesService,
    capas,
  )
})

describe("E1. GET /cursos/:cursoId/transversal", () => {
  it("404 si el curso no existe", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerPorCurso(CURSO_ID, ADMIN)).rejects.toBeInstanceOf(NotFoundException)
  })

  it("404 transversalNoEncontrado si curso.transversalId === null", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({ id: CURSO_ID, transversalId: null })
    await expect(service.obtenerPorCurso(CURSO_ID, ADMIN)).rejects.toMatchObject({
      response: { code: apiErrorCodes.transversalNoEncontrado },
    })
  })

  it("200 admin -> response con pesos, capas activas y skills", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({
      id: CURSO_ID,
      transversalId: TRANSVERSAL_ID,
    })
    prisma.proyectoTransversal.findUniqueOrThrow.mockResolvedValueOnce({
      id: TRANSVERSAL_ID,
      cursoId: CURSO_ID,
      descripcion: "proyecto",
      umbralAprobacion: new Prisma.Decimal(70),
      pesoCapaTests: new Prisma.Decimal(40),
      pesoCapaCualitativa: new Prisma.Decimal(30),
      pesoCapaComprension: new Prisma.Decimal(30),
      capaTestsActiva: true,
      capaCualitativaActiva: true,
      capaComprensionActiva: true,
      skills: [
        {
          skillId: SKILL_ID,
          skill: { etiquetaVisible: "python", areaId: "a1" },
        },
      ],
    })
    const r = await service.obtenerPorCurso(CURSO_ID, ADMIN)
    expect(r.umbralAprobacion).toBe(70)
    expect(r.pesosCapas.tests).toBe(40)
    expect(r.skillsQueMide).toHaveLength(1)
  })
})

describe("E3. GET disponibilidad", () => {
  it("404 si curso no tiene transversal", async () => {
    configurarAsignacion(prisma, { transversalId: null })
    await expect(service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("SIEMPRE -> disponible=true", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.SIEMPRE })
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)
    expect(r).toEqual({ disponible: true, razon: "SIEMPRE", fechaDisponibleDesde: null })
  })

  it("DESDE_FECHA con fecha pasada -> disponible=true", async () => {
    configurarAsignacion(prisma, {
      desbloqueo: DesbloqueoCurso.DESDE_FECHA,
      fechaDesbloqueo: new Date("2020-01-01"),
    })
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)
    expect(r.disponible).toBe(true)
    expect(r.razon).toBe("DESDE_FECHA")
  })

  it("ENCADENADO sin plan completo -> BLOQUEADO_PLAN_INCOMPLETO", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.ENCADENADO })
    prisma.planEstudio.findUnique.mockResolvedValue(null)
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)
    expect(r.disponible).toBe(false)
    expect(r.razon).toBe("BLOQUEADO_PLAN_INCOMPLETO")
  })
})

describe("E4. POST intento", () => {
  it("409 si transversal no disponible (ENCADENADO sin plan)", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.ENCADENADO })
    prisma.planEstudio.findUnique.mockResolvedValue(null)
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("422 si curso no ACTIVO", async () => {
    configurarAsignacion(prisma, { cursoEstado: EstadoCurso.BORRADOR })
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })

  it("422 si asignacion no esta EN_PROGRESO/LISTO", async () => {
    configurarAsignacion(prisma, { estadoAsignado: EstadoAsignado.ASIGNADO })
    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })

  it("201 happy: crea intento, devuelve EN_EVALUACION + ETA, dispatch al job", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.SIEMPRE })
    prisma.intentoTransversal.create.mockResolvedValueOnce({
      id: INTENTO_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
    })
    const r = await service.crearIntento({
      asignacionId: ASIGNACION_ID,
      body: {
        repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL },
        comentarioColaborador: "hola",
      },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })
    expect(r.intentoId).toBe(INTENTO_ID)
    expect(r.estado).toBe("EN_EVALUACION")
    expect(r.evaluacionAsincronaEsperada).toMatch(/2026-05-11T10:00:02/)
    expect(job.dispatch).toHaveBeenCalledWith(INTENTO_ID)
  })
})

describe("E5. GET intento por id", () => {
  it("404 si no existe", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerIntento(INTENTO_ID, ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("ADMIN ve detalle completo (notas + anulado + motivoAnulacion)", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
      estado: "EVALUADO",
      anulado: false,
      motivoAnulacion: null,
      repoUrl: REPO_URL,
      repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL },
      comentarioColaborador: null,
      notaCapaTests: new Prisma.Decimal(70),
      notaCapaCualitativa: new Prisma.Decimal(80),
      notaCapaComprension: new Prisma.Decimal(72),
      notaGlobal: null,
      aprobado: null,
    })
    const r = (await service.obtenerIntento(INTENTO_ID, ADMIN)) as Record<string, unknown>
    expect(r.notaCapaTests).toBe(70)
    expect(r.notaCapaCualitativa).toBe(80)
    expect(r.anulado).toBe(false)
  })

  it("PARTICIPANTE ajeno -> 404 (D-AS-9 patron uniforme)", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_AJENO,
      fecha: new Date("2026-05-11T10:00:00Z"),
      estado: "EN_EVALUACION",
      anulado: false,
      motivoAnulacion: null,
      repoUrl: REPO_URL,
      repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL },
      comentarioColaborador: null,
      notaCapaTests: null,
      notaCapaCualitativa: null,
      notaCapaComprension: null,
      notaGlobal: null,
      aprobado: null,
    })
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLABORADOR_ID })
    await expect(service.obtenerIntento(INTENTO_ID, PARTICIPANTE)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("PARTICIPANTE propio EN_EVALUACION no recibe notas (solo metadata)", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
      estado: "EN_EVALUACION",
      anulado: false,
      motivoAnulacion: null,
      repoUrl: REPO_URL,
      repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL },
      comentarioColaborador: null,
      notaCapaTests: new Prisma.Decimal(70),
      notaCapaCualitativa: new Prisma.Decimal(80),
      notaCapaComprension: null,
      notaGlobal: null,
      aprobado: null,
    })
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLABORADOR_ID })
    const r = (await service.obtenerIntento(INTENTO_ID, PARTICIPANTE)) as Record<string, unknown>
    expect("notaCapaTests" in r).toBe(false)
    expect(r.notaGlobal).toBeNull()
    expect(r.aprobado).toBeNull()
  })

  it("PARTICIPANTE propio FINALIZADO recibe notaGlobal + aprobado", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
      estado: "FINALIZADO",
      anulado: false,
      motivoAnulacion: null,
      repoUrl: REPO_URL,
      repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL },
      comentarioColaborador: null,
      notaCapaTests: new Prisma.Decimal(70),
      notaCapaCualitativa: new Prisma.Decimal(80),
      notaCapaComprension: new Prisma.Decimal(72),
      notaGlobal: new Prisma.Decimal(74),
      aprobado: true,
    })
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLABORADOR_ID })
    const r = (await service.obtenerIntento(INTENTO_ID, PARTICIPANTE)) as Record<string, unknown>
    expect("notaCapaTests" in r).toBe(false)
    expect(r.notaGlobal).toBe(74)
    expect(r.aprobado).toBe(true)
  })
})

describe("E2. POST skills transversal", () => {
  it("422 si skill no existe / archivada", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({
      id: CURSO_ID,
      estado: EstadoCurso.ACTIVO,
      transversalId: TRANSVERSAL_ID,
    })
    prisma.skill.findMany.mockResolvedValueOnce([{ id: SKILL_ID }])
    prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([])
    await expect(
      service.actualizarSkills({
        cursoId: CURSO_ID,
        body: { skillIds: [SKILL_ID, "31111111-1111-1111-1111-111111111199"] },
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })

  it("200 happy: replace skills + cuenta intentos finalizados", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({
      id: CURSO_ID,
      estado: EstadoCurso.ACTIVO,
      transversalId: TRANSVERSAL_ID,
    })
    prisma.skill.findMany.mockResolvedValueOnce([{ id: SKILL_ID }])
    prisma.cursoSkillExigida.findMany.mockResolvedValueOnce([{ skillId: SKILL_ID }])
    prisma.intentoTransversal.findMany.mockResolvedValueOnce([{ id: "i1" }, { id: "i2" }])
    const r = await service.actualizarSkills({
      cursoId: CURSO_ID,
      body: { skillIds: [SKILL_ID] },
    })
    expect(r.transversalId).toBe(TRANSVERSAL_ID)
    expect(r.skillsActualizadas).toEqual([SKILL_ID])
    expect(r.intentosRecalculados).toBe(2)
  })
})

// =============================================================================
// P8b — capas + finalizar + anular
// =============================================================================

describe("E7. POST /intentos-transversal/:id/capas/tests (P8b)", () => {
  function intentoBase(
    overrides: Partial<{
      estado: string
      anulado: boolean
      capaTestsActiva: boolean
      notaCualitativa: number | null
      notaComprension: number | null
    }> = {},
  ) {
    return {
      id: INTENTO_ID,
      estado: overrides.estado ?? "EN_EVALUACION",
      anulado: overrides.anulado ?? false,
      notaCapaTests: null,
      notaCapaCualitativa:
        overrides.notaCualitativa === undefined
          ? null
          : overrides.notaCualitativa === null
            ? null
            : new Prisma.Decimal(overrides.notaCualitativa),
      notaCapaComprension:
        overrides.notaComprension === undefined
          ? null
          : overrides.notaComprension === null
            ? null
            : new Prisma.Decimal(overrides.notaComprension),
      evaluacionesCapas: {},
      transversal: {
        capaTestsActiva: overrides.capaTestsActiva ?? true,
        capaCualitativaActiva: true,
        capaComprensionActiva: true,
      },
    }
  }

  it("404 si el intento no existe", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.cargarCapaTests({
        intentoId: INTENTO_ID,
        body: { nota: 70, detalle: { fuente: "ci" } },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("409 si estado FINALIZADO (conflictIntentoTransversalNoEditable)", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(
      intentoBase({ estado: "FINALIZADO" }),
    )
    await expect(
      service.cargarCapaTests({
        intentoId: INTENTO_ID,
        body: { nota: 70, detalle: {} },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictIntentoTransversalNoEditable },
    })
  })

  it("409 conflictCapaInactiva si capa tests desactivada", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(
      intentoBase({ capaTestsActiva: false }),
    )
    await expect(
      service.cargarCapaTests({
        intentoId: INTENTO_ID,
        body: { nota: 70, detalle: {} },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCapaInactiva },
    })
  })

  it("persiste nota y transita a EVALUADO si era la 3a capa", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(
      intentoBase({ notaCualitativa: 80, notaComprension: 70 }),
    )
    prisma.intentoTransversal.update.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      fecha: new Date(),
      estado: "EVALUADO",
      anulado: false,
      motivoAnulacion: null,
      repoUrl: REPO_URL,
      repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL },
      comentarioColaborador: null,
      notaCapaTests: new Prisma.Decimal(75),
      notaCapaCualitativa: new Prisma.Decimal(80),
      notaCapaComprension: new Prisma.Decimal(70),
      notaGlobal: null,
      aprobado: false,
    })
    const r = await service.cargarCapaTests({
      intentoId: INTENTO_ID,
      body: { nota: 75, detalle: { fuente: "ci" } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })
    expect(prisma.intentoTransversal.update).toHaveBeenCalledOnce()
    const updateArgs = prisma.intentoTransversal.update.mock.calls[0]?.[0] as {
      data: { estado?: string; notaCapaTests?: Prisma.Decimal }
    }
    expect(updateArgs.data.estado).toBe("EVALUADO")
    expect(r.response.estado).toBe("EVALUADO")
    // FIX-P8-cierre §5.116: cargarCapa* devuelve `{ response, replay, capa }`.
    expect(r.capa).toBe("tests")
    expect(r.replay).toBe(false)
  })
})

describe("E10. POST /intentos-transversal/:id/finalizar (P8b)", () => {
  it("404 si el intento no existe", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.finalizar({ intentoId: INTENTO_ID, usuario: ADMIN }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("409 si estado != EVALUADO", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "EN_EVALUACION",
      anulado: false,
      notaCapaTests: null,
      notaCapaCualitativa: null,
      notaCapaComprension: null,
      transversal: {
        cursoId: CURSO_ID,
        umbralAprobacion: new Prisma.Decimal(70),
        pesoCapaTests: new Prisma.Decimal(40),
        pesoCapaCualitativa: new Prisma.Decimal(30),
        pesoCapaComprension: new Prisma.Decimal(30),
        capaTestsActiva: true,
        capaCualitativaActiva: true,
        capaComprensionActiva: true,
        skills: [],
      },
    })
    await expect(
      service.finalizar({ intentoId: INTENTO_ID, usuario: ADMIN }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictIntentoTransversalNoEvaluado },
    })
  })

  it("calcula nota global, marca aprobado y replica a skills etiquetadas", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "EVALUADO",
      anulado: false,
      notaCapaTests: new Prisma.Decimal(80),
      notaCapaCualitativa: new Prisma.Decimal(70),
      notaCapaComprension: new Prisma.Decimal(90),
      transversal: {
        cursoId: CURSO_ID,
        umbralAprobacion: new Prisma.Decimal(70),
        pesoCapaTests: new Prisma.Decimal(40),
        pesoCapaCualitativa: new Prisma.Decimal(30),
        pesoCapaComprension: new Prisma.Decimal(30),
        capaTestsActiva: true,
        capaCualitativaActiva: true,
        capaComprensionActiva: true,
        skills: [{ skillId: SKILL_ID }, { skillId: "skill-2" }],
      },
    })
    prisma.intentoTransversal.updateMany.mockResolvedValueOnce({ count: 1 })

    const r = await service.finalizar({ intentoId: INTENTO_ID, usuario: ADMIN })

    // 0.4*80 + 0.3*70 + 0.3*90 = 80
    expect(r.notaGlobal).toBe(80)
    expect(r.aprobado).toBe(true)
    expect(r.skillsActualizadas).toEqual([SKILL_ID, "skill-2"])
    expect(notaSkill.recalcularConFuentes).toHaveBeenCalledTimes(2)
  })

  it("409 conflictIntentoTransversalYaAnulado si anulado=true", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "FINALIZADO",
      anulado: true,
      notaCapaTests: new Prisma.Decimal(80),
      notaCapaCualitativa: new Prisma.Decimal(70),
      notaCapaComprension: new Prisma.Decimal(90),
      transversal: {
        cursoId: CURSO_ID,
        umbralAprobacion: new Prisma.Decimal(70),
        pesoCapaTests: new Prisma.Decimal(40),
        pesoCapaCualitativa: new Prisma.Decimal(30),
        pesoCapaComprension: new Prisma.Decimal(30),
        capaTestsActiva: true,
        capaCualitativaActiva: true,
        capaComprensionActiva: true,
        skills: [],
      },
    })
    await expect(
      service.finalizar({ intentoId: INTENTO_ID, usuario: ADMIN }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictIntentoTransversalYaAnulado },
    })
  })
})

describe("E11. POST /intentos-transversal/:id/anular (P8b)", () => {
  it("404 si el intento no existe", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.anular({
        intentoId: INTENTO_ID,
        motivo: "duplicado",
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("409 conflictIntentoTransversalYaAnulado si ya anulado", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "ANULADO",
      anulado: true,
      transversal: { cursoId: CURSO_ID, skills: [] },
    })
    await expect(
      service.anular({
        intentoId: INTENTO_ID,
        motivo: "motivo de prueba",
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictIntentoTransversalYaAnulado },
    })
  })

  it("anula + recalcula skills etiquetadas + responde con skillsRecalculadas", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "FINALIZADO",
      anulado: false,
      transversal: { cursoId: CURSO_ID, skills: [{ skillId: SKILL_ID }] },
    })
    prisma.intentoTransversal.updateMany.mockResolvedValueOnce({ count: 1 })
    const r = await service.anular({
      intentoId: INTENTO_ID,
      motivo: "duplicado por error",
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })
    expect(r.response.anulado).toBe(true)
    expect(r.response.skillsRecalculadas).toEqual([SKILL_ID])
    expect(notaSkill.recalcularConFuentes).toHaveBeenCalledOnce()
    expect(r.replay).toBe(false)
  })
})

// ===========================================================================
// P11.5a — Trigger TRANSVERSAL_DISPONIBLE (D-S11.5-A3, D42)
// ===========================================================================

describe("TransversalService P11.5a — TRANSVERSAL_DISPONIBLE en crearIntento", () => {
  function configurarFindUniqueCombinado(): void {
    prisma.asignacionCurso.findUnique.mockImplementation(
      (args: { select?: Record<string, unknown> }) => {
        if (args.select && "curso" in args.select && "colaborador" in args.select) {
          // findUnique del helper notificarTransversalDisponible.
          return Promise.resolve({
            curso: { id: CURSO_ID, titulo: "Curso transversal" },
            colaborador: { usuario: { id: USUARIO_ID } },
          })
        }
        // findUnique de resolverAsignacionConCurso.
        return Promise.resolve({
          id: ASIGNACION_ID,
          colaboradorId: COLABORADOR_ID,
          cursoId: CURSO_ID,
          rol: RolAsignacion.ASIGNADO,
          estadoAsignado: EstadoAsignado.EN_PROGRESO,
          estadoVoluntario: null,
          curso: {
            id: CURSO_ID,
            estado: EstadoCurso.ACTIVO,
            desbloqueo: DesbloqueoCurso.SIEMPRE,
            fechaDesbloqueo: null,
            transversalId: TRANSVERSAL_ID,
            entrevistaIaId: null,
          },
        })
      },
    )
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
  }

  it("emite TRANSVERSAL_DISPONIBLE en el primer intento del colaborador (intentosPrevios=0)", async () => {
    configurarFindUniqueCombinado()
    prisma.intentoTransversal.count.mockResolvedValueOnce(0)
    prisma.intentoTransversal.create.mockResolvedValueOnce({
      id: INTENTO_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
    })

    await service.crearIntento({
      asignacionId: ASIGNACION_ID,
      body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })

    expect(notificaciones.crear).toHaveBeenCalledWith({
      usuarioId: USUARIO_ID,
      tipo: "TRANSVERSAL_DISPONIBLE",
      payload: {
        asignacionId: ASIGNACION_ID,
        cursoId: CURSO_ID,
        cursoTitulo: "Curso transversal",
        intentoTransversalId: INTENTO_ID,
      },
    })
  })

  it("NO emite TRANSVERSAL_DISPONIBLE en intentos posteriores (intentosPrevios>0)", async () => {
    configurarFindUniqueCombinado()
    prisma.intentoTransversal.count.mockResolvedValueOnce(2)
    prisma.intentoTransversal.create.mockResolvedValueOnce({
      id: INTENTO_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
    })

    await service.crearIntento({
      asignacionId: ASIGNACION_ID,
      body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })

    expect(notificaciones.crear).not.toHaveBeenCalled()
  })

  it("consulta count de intentos previos (idempotencia inter-intentos)", async () => {
    configurarFindUniqueCombinado()
    prisma.intentoTransversal.count.mockResolvedValueOnce(0)
    prisma.intentoTransversal.create.mockResolvedValueOnce({
      id: INTENTO_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
    })

    await service.crearIntento({
      asignacionId: ASIGNACION_ID,
      body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })

    expect(prisma.intentoTransversal.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          transversalId: TRANSVERSAL_ID,
          colaboradorId: COLABORADOR_ID,
        }),
      }),
    )
  })

  it("error en notificaciones.crear NO propaga al participante (best-effort)", async () => {
    configurarFindUniqueCombinado()
    prisma.intentoTransversal.count.mockResolvedValueOnce(0)
    prisma.intentoTransversal.create.mockResolvedValueOnce({
      id: INTENTO_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
    })
    notificaciones.crear.mockRejectedValueOnce(new Error("notif down"))

    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).resolves.toMatchObject({ intentoId: INTENTO_ID })
  })
})
