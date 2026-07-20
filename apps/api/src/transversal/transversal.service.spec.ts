import { ConflictException, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import {
  DesbloqueoCurso,
  EstadoAsignado,
  EstadoCurso,
  Prisma,
  RolAsignacion,
  RolUsuario,
  TipoEventoNotif,
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
  proyectoTransversal: {
    findUniqueOrThrow: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  asignacionCurso: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
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
  usuario: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
  planEstudio: { findUnique: ReturnType<typeof vi.fn> }
  itemPlan: { findMany: ReturnType<typeof vi.fn> }
  intentoBloque: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    curso: { findUnique: vi.fn() },
    proyectoTransversal: {
      findUniqueOrThrow: vi.fn(),
      findUnique: vi.fn().mockResolvedValue({ intentosMax: 3 }),
    },
    asignacionCurso: { findUnique: vi.fn(), update: vi.fn() },
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
    usuario: {
      findUnique: vi.fn(),
      // Audiencia del broadcast TRANSVERSAL_POR_REVISAR (admins activos).
      findMany: vi.fn().mockResolvedValue([{ id: "admin-notif" }]),
    },
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
    intentosExtra: number
  }> = {},
): void {
  prisma.asignacionCurso.findUnique.mockResolvedValue({
    id: ASIGNACION_ID,
    colaboradorId: overrides.colaboradorId ?? COLABORADOR_ID,
    cursoId: CURSO_ID,
    rol: RolAsignacion.ASIGNADO,
    estadoAsignado: overrides.estadoAsignado ?? EstadoAsignado.EN_PROGRESO,
    estadoVoluntario: null,
    intentosExtraTransversal: overrides.intentosExtra ?? 0,
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
  capas = new TransversalCapasService(
    idempotency as unknown as IdempotencyService,
    prisma as unknown as PrismaService,
    notificaciones as unknown as NotificacionesService,
  )
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
      intentosMax: 3,
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

  it("SIEMPRE -> disponible=true, motivoBloqueo=null", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.SIEMPRE })
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)
    expect(r).toEqual({
      disponible: true,
      razon: "SIEMPRE",
      fechaDisponibleDesde: null,
      motivoBloqueo: null,
    })
  })

  it("DESDE_FECHA con fecha pasada -> disponible=true, motivoBloqueo=null", async () => {
    configurarAsignacion(prisma, {
      desbloqueo: DesbloqueoCurso.DESDE_FECHA,
      fechaDesbloqueo: new Date("2020-01-01"),
    })
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)
    expect(r.disponible).toBe(true)
    expect(r.razon).toBe("DESDE_FECHA")
    expect(r.motivoBloqueo).toBeNull()
  })

  it("DESDE_FECHA con fecha futura -> disponible=false, motivoBloqueo con fecha", async () => {
    configurarAsignacion(prisma, {
      desbloqueo: DesbloqueoCurso.DESDE_FECHA,
      fechaDesbloqueo: new Date("2099-01-15"),
    })
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)
    expect(r.disponible).toBe(false)
    expect(r.motivoBloqueo).toContain("Disponible desde")
    expect(r.motivoBloqueo).toContain("2099")
  })

  it("ENCADENADO sin plan completo -> BLOQUEADO_PLAN_INCOMPLETO + motivo", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.ENCADENADO })
    prisma.planEstudio.findUnique.mockResolvedValue(null)
    const r = await service.obtenerDisponibilidad(ASIGNACION_ID, ADMIN)
    expect(r.disponible).toBe(false)
    expect(r.razon).toBe("BLOQUEADO_PLAN_INCOMPLETO")
    expect(r.motivoBloqueo).toBe("Completa tu plan de estudio antes de empezar el transversal.")
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

  it("409 cuando alcanzo el tope de intentos (intentosMax) y no crea intento", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.SIEMPRE })
    prisma.proyectoTransversal.findUnique.mockResolvedValue({ intentosMax: 3 })
    prisma.intentoTransversal.count.mockResolvedValue(3) // ya uso 3 no anulados

    await expect(
      service.crearIntento({
        asignacionId: ASIGNACION_ID,
        body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
        idempotencyKey: IDEMPOTENCY_KEY,
        usuario: ADMIN,
      }),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(prisma.intentoTransversal.create).not.toHaveBeenCalled()
    expect(job.dispatch).not.toHaveBeenCalled()
  })

  it("permite el intento cuando el extra por participante sube el cupo", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.SIEMPRE, intentosExtra: 1 })
    prisma.proyectoTransversal.findUnique.mockResolvedValue({ intentosMax: 3 })
    prisma.intentoTransversal.count.mockResolvedValue(3) // 3 usados, pero cupo = 3 + 1
    prisma.intentoTransversal.create.mockResolvedValueOnce({
      id: INTENTO_ID,
      fecha: new Date("2026-05-11T10:00:00Z"),
    })

    const r = await service.crearIntento({
      asignacionId: ASIGNACION_ID,
      body: { repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })

    expect(r.intentoId).toBe(INTENTO_ID)
    expect(job.dispatch).toHaveBeenCalledWith(INTENTO_ID)
  })

  it("el conteo de cupo excluye anulados y repo inaccesible (where completo) y crea el intento", async () => {
    configurarAsignacion(prisma, { desbloqueo: DesbloqueoCurso.SIEMPRE })
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
          anulado: false,
          // B2c: un repo inaccesible no consume ficha → se excluye del conteo.
          estado: { not: "FALLO_ACCESO_REPO" },
        }),
      }),
    )
    expect(prisma.intentoTransversal.create).toHaveBeenCalledOnce()
  })
})

describe("E5. GET intento por id", () => {
  it("404 si no existe", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerIntento(INTENTO_ID, ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("ADMIN ve detalle completo (notas + anulado + motivoAnulacion + contexto)", async () => {
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
      notaAjustadaAdmin: null,
      motivoAjusteNota: null,
      aprobado: null,
      colaborador: { id: COLABORADOR_ID, nombre: "Colab", email: "c@nttdata.test" },
      transversal: {
        id: TRANSVERSAL_ID,
        descripcion: "Mini-proyecto",
        umbralAprobacion: new Prisma.Decimal(70),
        pesoCapaTests: new Prisma.Decimal(40),
        pesoCapaCualitativa: new Prisma.Decimal(30),
        pesoCapaComprension: new Prisma.Decimal(30),
        capaTestsActiva: true,
        capaCualitativaActiva: true,
        capaComprensionActiva: true,
        curso: { id: CURSO_ID, titulo: "Curso mock" },
      },
    })
    const r = (await service.obtenerIntento(INTENTO_ID, ADMIN)) as Record<string, unknown>
    // B-nota: el detalle computa la nota que la IA calcularía (0.4*70 + 0.3*80 + 0.3*72).
    expect(r.notaCalculada).toBe(73.6)
    expect(r.notaAjustadaAdmin).toBeNull()
    expect(r.notaCapaTests).toBe(70)
    expect(r.notaCapaCualitativa).toBe(80)
    expect(r.anulado).toBe(false)
    expect(r.colaborador).toEqual({
      id: COLABORADOR_ID,
      nombre: "Colab",
      email: "c@nttdata.test",
    })
    expect(r.curso).toEqual({ id: CURSO_ID, titulo: "Curso mock" })
    expect(r.transversal).toEqual({
      id: TRANSVERSAL_ID,
      descripcion: "Mini-proyecto",
      umbralAprobacion: 70,
    })
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

describe("E5 cupo. obtenerIntento ADMIN enriquece cupoIntentos (Fase 4b ②)", () => {
  function mockIntentoAdmin(): void {
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
      notaCapaTests: null,
      notaCapaCualitativa: null,
      notaCapaComprension: null,
      notaGlobal: null,
      notaAjustadaAdmin: null,
      motivoAjusteNota: null,
      aprobado: null,
      colaborador: { id: COLABORADOR_ID, nombre: "Colab", email: "c@nttdata.test" },
      transversal: {
        id: TRANSVERSAL_ID,
        descripcion: "Mini-proyecto",
        umbralAprobacion: new Prisma.Decimal(70),
        pesoCapaTests: new Prisma.Decimal(40),
        pesoCapaCualitativa: new Prisma.Decimal(30),
        pesoCapaComprension: new Prisma.Decimal(30),
        capaTestsActiva: true,
        capaCualitativaActiva: true,
        capaComprensionActiva: true,
        curso: { id: CURSO_ID, titulo: "Curso mock" },
      },
    })
  }

  it("cupoIntentos = usados / (intentosMax + extra)", async () => {
    mockIntentoAdmin()
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIGNACION_ID,
      intentosExtraTransversal: 2,
    })
    prisma.proyectoTransversal.findUnique.mockResolvedValueOnce({ intentosMax: 3 })
    prisma.intentoTransversal.count.mockResolvedValueOnce(4)
    const r = (await service.obtenerIntento(INTENTO_ID, ADMIN)) as Record<string, unknown>
    expect(r.cupoIntentos).toEqual({
      asignacionId: ASIGNACION_ID,
      intentosUsados: 4,
      intentosCupo: 5,
    })
  })

  it("cupoIntentos = null si la asignación ya no existe", async () => {
    mockIntentoAdmin()
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce(null)
    const r = (await service.obtenerIntento(INTENTO_ID, ADMIN)) as Record<string, unknown>
    expect(r.cupoIntentos).toBeNull()
  })
})

describe("E12. POST /asignaciones/:id/intentos-transversal/intento-extra (dar +1)", () => {
  it("incrementa intentosExtraTransversal y devuelve el cupo nuevo", async () => {
    prisma.asignacionCurso.findUnique
      .mockResolvedValueOnce({
        colaboradorId: COLABORADOR_ID,
        curso: { id: CURSO_ID, transversalId: TRANSVERSAL_ID },
      })
      .mockResolvedValueOnce({ id: ASIGNACION_ID, intentosExtraTransversal: 1 })
    prisma.asignacionCurso.update.mockResolvedValueOnce({ id: ASIGNACION_ID })
    prisma.proyectoTransversal.findUnique.mockResolvedValueOnce({ intentosMax: 3 })
    prisma.intentoTransversal.count.mockResolvedValueOnce(3)

    const r = await service.darIntentoExtra({ asignacionId: ASIGNACION_ID })

    expect(prisma.asignacionCurso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ASIGNACION_ID },
        data: { intentosExtraTransversal: { increment: 1 } },
      }),
    )
    expect(r).toEqual({ asignacionId: ASIGNACION_ID, intentosUsados: 3, intentosCupo: 4 })
  })

  it("404 si la asignación no existe (no incrementa)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce(null)
    await expect(service.darIntentoExtra({ asignacionId: ASIGNACION_ID })).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(prisma.asignacionCurso.update).not.toHaveBeenCalled()
  })

  it("404 si el curso no tiene transversal (no incrementa)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      colaboradorId: COLABORADOR_ID,
      curso: { id: CURSO_ID, transversalId: null },
    })
    await expect(service.darIntentoExtra({ asignacionId: ASIGNACION_ID })).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(prisma.asignacionCurso.update).not.toHaveBeenCalled()
  })
})

describe("E15. GET /asignaciones/:id/transversal/cupo (cupo del participante, B1)", () => {
  it("devuelve usados / (intentosMax + extra); los anulados no cuentan", async () => {
    configurarAsignacion(prisma, { intentosExtra: 2 })
    prisma.intentoTransversal.count.mockResolvedValue(1)
    const r = await service.obtenerCupoIntentos(ASIGNACION_ID, ADMIN)
    expect(r).toEqual({ asignacionId: ASIGNACION_ID, intentosUsados: 1, intentosCupo: 5 })
    // El conteo excluye los anulados (misma regla que verificarCupoIntentos).
    expect(prisma.intentoTransversal.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ anulado: false }) }),
    )
  })

  it("404 transversalNoEncontrado si el curso no tiene transversal", async () => {
    configurarAsignacion(prisma, { transversalId: null })
    await expect(service.obtenerCupoIntentos(ASIGNACION_ID, ADMIN)).rejects.toMatchObject({
      response: { code: apiErrorCodes.transversalNoEncontrado },
    })
  })

  it("participante que no es dueño de la asignación -> 404 (anti-IDOR, no calcula cupo)", async () => {
    configurarAsignacion(prisma)
    // El participante autenticado apunta a OTRO colaborador que el de la asignación.
    prisma.usuario.findUnique.mockResolvedValue({
      colaboradorId: "f0000000-0000-0000-0000-0000000000ff",
    })
    await expect(service.obtenerCupoIntentos(ASIGNACION_ID, PARTICIPANTE)).rejects.toMatchObject({
      response: { code: apiErrorCodes.asignacionNoEncontrada },
    })
    expect(prisma.intentoTransversal.count).not.toHaveBeenCalled()
  })

  it("participante dueño -> ve su propio cupo", async () => {
    configurarAsignacion(prisma, { intentosExtra: 0 })
    prisma.intentoTransversal.count.mockResolvedValue(3)
    const r = await service.obtenerCupoIntentos(ASIGNACION_ID, PARTICIPANTE)
    expect(r).toEqual({ asignacionId: ASIGNACION_ID, intentosUsados: 3, intentosCupo: 3 })
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
      colaborador: { id: COLABORADOR_ID, nombre: "Colab", email: "c@nttdata.test" },
      transversal: {
        id: TRANSVERSAL_ID,
        descripcion: "Mini-proyecto",
        umbralAprobacion: new Prisma.Decimal(70),
        curso: { id: CURSO_ID, titulo: "Curso mock" },
      },
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
    // Fase 4b: al transicionar a EVALUADO se avisa a los admins activos.
    expect(notificaciones.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "admin-notif",
        tipo: TipoEventoNotif.TRANSVERSAL_POR_REVISAR,
        payload: expect.objectContaining({ intentoTransversalId: INTENTO_ID }),
      }),
    )
  })

  it("NO avisa a los admins si la carga no transiciona a EVALUADO", async () => {
    // Solo se carga tests; cualitativa/comprensión activas siguen sin nota → el
    // intento sigue EN_EVALUACION y no debe dispararse el aviso.
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(intentoBase({}))
    prisma.intentoTransversal.update.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      fecha: new Date(),
      estado: "EN_EVALUACION",
      anulado: false,
      motivoAnulacion: null,
      repoUrl: REPO_URL,
      repoOArtefacto: { tipo: "URL_GIT", url: REPO_URL },
      comentarioColaborador: null,
      notaCapaTests: new Prisma.Decimal(75),
      notaCapaCualitativa: null,
      notaCapaComprension: null,
      notaGlobal: null,
      aprobado: false,
      colaborador: { id: COLABORADOR_ID, nombre: "Colab", email: "c@nttdata.test" },
      transversal: {
        id: TRANSVERSAL_ID,
        descripcion: "Mini-proyecto",
        umbralAprobacion: new Prisma.Decimal(70),
        curso: { id: CURSO_ID, titulo: "Curso mock" },
      },
    })
    const r = await service.cargarCapaTests({
      intentoId: INTENTO_ID,
      body: { nota: 75, detalle: { fuente: "ci" } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })
    expect(r.response.estado).toBe("EN_EVALUACION")
    expect(notificaciones.crear).not.toHaveBeenCalledWith(
      expect.objectContaining({ tipo: TipoEventoNotif.TRANSVERSAL_POR_REVISAR }),
    )
  })

  it("NO avisa a los admins en un replay idempotente aunque el estado sea EVALUADO", async () => {
    // El replay devuelve el body cacheado (estado EVALUADO) sin re-ejecutar: el
    // aviso ya se emitió en la ejecución original, no debe repetirse.
    idempotency.runOnce.mockImplementationOnce(
      async (input: {
        ejecutor: (tx: unknown) => Promise<{ status: number; body: unknown }>
      }) => {
        const res = await input.ejecutor(prisma)
        return { status: res.status, body: res.body, replay: true }
      },
    )
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
      colaborador: { id: COLABORADOR_ID, nombre: "Colab", email: "c@nttdata.test" },
      transversal: {
        id: TRANSVERSAL_ID,
        descripcion: "Mini-proyecto",
        umbralAprobacion: new Prisma.Decimal(70),
        curso: { id: CURSO_ID, titulo: "Curso mock" },
      },
    })
    const r = await service.cargarCapaTests({
      intentoId: INTENTO_ID,
      body: { nota: 75, detalle: { fuente: "ci" } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })
    expect(r.replay).toBe(true)
    expect(notificaciones.crear).not.toHaveBeenCalledWith(
      expect.objectContaining({ tipo: TipoEventoNotif.TRANSVERSAL_POR_REVISAR }),
    )
  })
})

describe("E8. capa cualitativa congela reporteIa + siembra reporteFinal + evidencia (Fase 4b ③)", () => {
  it("al cargar la cualitativa persiste reporteIa=reporteFinal=detalle y la evidencia", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      estado: "EN_EVALUACION",
      anulado: false,
      notaCapaTests: null,
      notaCapaCualitativa: null,
      notaCapaComprension: null,
      evaluacionesCapas: {},
      // Solo la cualitativa activa → cargarla completa las capas → EVALUADO.
      transversal: {
        capaTestsActiva: false,
        capaCualitativaActiva: true,
        capaComprensionActiva: false,
      },
    })
    prisma.intentoTransversal.update.mockResolvedValueOnce(
      intentoSeleccionadoFixture({ estado: "EVALUADO" }),
    )

    const detalle = { comentario: "informe IA", confianza: "MEDIA" as const }
    const evidencia = {
      commit: "abc1234",
      archivos: ["index.js"],
      truncado: false,
      bytesTotales: 42,
      contenido: "===== index.js =====\n1",
    }
    // El snapshot del repo solo fluye por el CapasService (lo pasa el job),
    // no por el escape manual del admin en TransversalService.
    await capas.cargarCapaCualitativa({
      intentoId: INTENTO_ID,
      body: { nota: 80, detalle },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
      evidenciaRepo: evidencia,
    })

    const data = prisma.intentoTransversal.update.mock.calls[0]?.[0]?.data as Record<
      string,
      unknown
    >
    expect(data.reporteIa).toEqual(detalle)
    expect(data.reporteFinal).toEqual(detalle)
    expect(data.evidenciaRepo).toEqual(evidencia)
    expect(data.estado).toBe("EVALUADO")
  })

  it("al RECARGAR la capa NO pisa el reporteFinal ya curado por el admin", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      estado: "EVALUADO",
      anulado: false,
      notaCapaTests: null,
      notaCapaCualitativa: new Prisma.Decimal(80),
      notaCapaComprension: null,
      evaluacionesCapas: { cualitativa: { comentario: "crudo", confianza: "MEDIA" } },
      // El admin ya curó el informe final.
      reporteFinal: { comentario: "curado por el admin", confianza: "ALTA" },
      transversal: {
        capaTestsActiva: false,
        capaCualitativaActiva: true,
        capaComprensionActiva: false,
      },
    })
    prisma.intentoTransversal.update.mockResolvedValueOnce(
      intentoSeleccionadoFixture({ estado: "EVALUADO" }),
    )

    await capas.cargarCapaCualitativa({
      intentoId: INTENTO_ID,
      body: { nota: 90, detalle: { comentario: "nuevo crudo", confianza: "ALTA" as const } },
      idempotencyKey: IDEMPOTENCY_KEY,
      usuario: ADMIN,
    })

    const data = prisma.intentoTransversal.update.mock.calls[0]?.[0]?.data as Record<
      string,
      unknown
    >
    // El crudo se refresca...
    expect(data.reporteIa).toEqual({ comentario: "nuevo crudo", confianza: "ALTA" })
    // ...pero el final curado NO se toca (no está en el update).
    expect("reporteFinal" in data).toBe(false)
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
    // Fase 4b ③: finalizar sella la validación (quién publicó + cuándo).
    expect(prisma.intentoTransversal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "FINALIZADO",
          validadoPor: ADMIN.usuarioId,
          fechaValidacion: expect.any(Date),
        }),
      }),
    )
  })

  it("B-nota: sin ajuste, notaAjustadaAdmin queda null y publica la calculada", async () => {
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
        skills: [],
      },
    })
    prisma.intentoTransversal.updateMany.mockResolvedValueOnce({ count: 1 })

    const r = await service.finalizar({ intentoId: INTENTO_ID, usuario: ADMIN })

    expect(r.notaGlobal).toBe(80)
    expect(r.notaCalculada).toBe(80)
    expect(r.notaAjustada).toBeNull()
    expect(prisma.intentoTransversal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notaAjustadaAdmin: null, motivoAjusteNota: null }),
      }),
    )
  })

  it("B-nota: con ajuste, publica la nota ajustada y re-deriva aprobado + traza", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "EVALUADO",
      anulado: false,
      // La IA calcularía 15 (reprueba); el admin lo sube a 75 (aprueba).
      notaCapaTests: new Prisma.Decimal(15),
      notaCapaCualitativa: new Prisma.Decimal(15),
      notaCapaComprension: new Prisma.Decimal(15),
      transversal: {
        cursoId: CURSO_ID,
        umbralAprobacion: new Prisma.Decimal(70),
        pesoCapaTests: new Prisma.Decimal(40),
        pesoCapaCualitativa: new Prisma.Decimal(30),
        pesoCapaComprension: new Prisma.Decimal(30),
        capaTestsActiva: true,
        capaCualitativaActiva: true,
        capaComprensionActiva: true,
        skills: [{ skillId: SKILL_ID }],
      },
    })
    prisma.intentoTransversal.updateMany.mockResolvedValueOnce({ count: 1 })

    const r = await service.finalizar({
      intentoId: INTENTO_ID,
      usuario: ADMIN,
      notaAjustada: 75,
      motivoAjuste: "El repo se evaluó incompleto; la entrevista lo respalda.",
    })

    expect(r.notaGlobal).toBe(75)
    expect(r.notaAjustada).toBe(75)
    // La original (15) queda en la respuesta para auditar el "de 15 a 75".
    expect(r.notaCalculada).toBe(15)
    // 75 >= 70 aunque la calculada (15) reprobaría.
    expect(r.aprobado).toBe(true)
    expect(prisma.intentoTransversal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notaGlobal: new Prisma.Decimal(75),
          notaAjustadaAdmin: new Prisma.Decimal(75),
          motivoAjusteNota: "El repo se evaluó incompleto; la entrevista lo respalda.",
          aprobado: true,
        }),
      }),
    )
  })

  it("B-nota: ajuste a 0 se persiste como 0 (no null) y reprueba", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "EVALUADO",
      anulado: false,
      notaCapaTests: new Prisma.Decimal(80),
      notaCapaCualitativa: new Prisma.Decimal(80),
      notaCapaComprension: new Prisma.Decimal(80),
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
    prisma.intentoTransversal.updateMany.mockResolvedValueOnce({ count: 1 })

    const r = await service.finalizar({
      intentoId: INTENTO_ID,
      usuario: ADMIN,
      notaAjustada: 0,
      motivoAjuste: "Entrega vacía; anulo el crédito de la IA.",
    })

    expect(r.notaGlobal).toBe(0)
    expect(r.notaAjustada).toBe(0)
    expect(r.aprobado).toBe(false)
    expect(prisma.intentoTransversal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notaAjustadaAdmin: new Prisma.Decimal(0) }),
      }),
    )
  })

  it("B-nota: si la IA no pudo calcular, el override a mano permite publicar igual", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "EVALUADO",
      anulado: false,
      // Todas las capas activas SIN nota → calcularNotaTransversal lanza faltantes.
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
    prisma.intentoTransversal.updateMany.mockResolvedValueOnce({ count: 1 })

    const r = await service.finalizar({
      intentoId: INTENTO_ID,
      usuario: ADMIN,
      notaAjustada: 60,
      motivoAjuste: "La IA no pudo leer el repo; evalúo a mano con la entrevista.",
    })

    expect(r.notaCalculada).toBeNull()
    expect(r.notaGlobal).toBe(60)
    expect(r.notaAjustada).toBe(60)
  })

  it("B-nota: sin capas calculables Y sin override -> 409 puntajesFaltantes", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      transversalId: TRANSVERSAL_ID,
      colaboradorId: COLABORADOR_ID,
      estado: "EVALUADO",
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
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.puntajesFaltantes } })
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

// Fixture de un intento seleccionado completo (shape de SELECT_INTENTO_TRANSVERSAL_FIELDS)
// para probar mappers/curación sin repetir 20 campos en cada test.
function intentoSeleccionadoFixture(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
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
    notaCapaTests: null,
    notaCapaCualitativa: new Prisma.Decimal(80),
    notaCapaComprension: null,
    notaGlobal: null,
    notaAjustadaAdmin: null,
    motivoAjusteNota: null,
    aprobado: null,
    evaluacionesCapas: {},
    reporteIa: { comentario: "crudo", confianza: "MEDIA" },
    reporteFinal: { comentario: "crudo", confianza: "MEDIA" },
    evidenciaRepo: null,
    validadoPor: null,
    fechaValidacion: null,
    colaborador: { id: COLABORADOR_ID, nombre: "Colab", email: "c@nttdata.test" },
    transversal: {
      id: TRANSVERSAL_ID,
      descripcion: "Mini-proyecto",
      umbralAprobacion: new Prisma.Decimal(70),
      pesoCapaTests: new Prisma.Decimal(40),
      pesoCapaCualitativa: new Prisma.Decimal(30),
      pesoCapaComprension: new Prisma.Decimal(30),
      capaTestsActiva: true,
      capaCualitativaActiva: true,
      capaComprensionActiva: true,
      curso: { id: CURSO_ID, titulo: "Curso mock" },
    },
    ...overrides,
  }
}

const REPORTE_CURADO = {
  comentario: "Informe curado por el admin",
  confianza: "ALTA" as const,
  resumen: "Buen trabajo con matices",
  aReforzar: [{ que: "Cobertura de tests", sugerencia: "Añade casos borde" }],
}

describe("E13. PATCH /intentos-transversal/:id/reporte-final (curación, Fase 4b ③)", () => {
  it("404 si el intento no existe", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.curarReporteFinal({ intentoId: INTENTO_ID, reporteFinal: REPORTE_CURADO }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("409 no editable si el intento no está en EVALUADO", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      estado: "FINALIZADO",
      anulado: false,
    })
    await expect(
      service.curarReporteFinal({ intentoId: INTENTO_ID, reporteFinal: REPORTE_CURADO }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictIntentoTransversalNoEditable },
    })
  })

  it("EVALUADO: persiste reporteFinal (sin tocar reporteIa) y devuelve el detalle admin", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      estado: "EVALUADO",
      anulado: false,
    })
    prisma.intentoTransversal.update.mockResolvedValueOnce(
      intentoSeleccionadoFixture({ reporteFinal: REPORTE_CURADO }),
    )

    const r = (await service.curarReporteFinal({
      intentoId: INTENTO_ID,
      reporteFinal: REPORTE_CURADO,
    })) as Record<string, unknown>

    expect(prisma.intentoTransversal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: INTENTO_ID },
        data: { reporteFinal: REPORTE_CURADO },
      }),
    )
    expect(r.reporteFinal).toMatchObject({ comentario: "Informe curado por el admin" })
    // El crudo de la IA nunca se toca al curar.
    expect(r.reporteIa).toMatchObject({ comentario: "crudo" })
  })
})

const EVIDENCIA = {
  commit: "abc1234",
  archivos: ["index.js", "README.md"],
  truncado: false,
  bytesTotales: 1200,
  contenido: "===== index.js =====\nexport const x = 1",
}

describe("E14. GET /intentos-transversal/:id/evidencia-repo (Fase 4b ③)", () => {
  it("404 si el intento no existe", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerEvidenciaRepo({ intentoId: INTENTO_ID })).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("404 si el intento aún no tiene evidencia", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      evidenciaRepo: null,
    })
    await expect(service.obtenerEvidenciaRepo({ intentoId: INTENTO_ID })).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("devuelve el snapshot completo (incluye contenido)", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      id: INTENTO_ID,
      evidenciaRepo: EVIDENCIA,
    })
    const r = await service.obtenerEvidenciaRepo({ intentoId: INTENTO_ID })
    expect(r).toEqual(EVIDENCIA)
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
    // Persistente (no Once): count se consulta 2 veces por request (cupo + previos).
    prisma.intentoTransversal.count.mockResolvedValue(2)
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

describe("E6b. GET /cursos/:cursoId/intentos-transversal (listado por curso, admin)", () => {
  it("404 si el curso no existe", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce(null)
    await expect(
      service.listarIntentosPorCurso({
        cursoId: CURSO_ID,
        query: { page: 1, pageSize: 20 },
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("404 si el curso no tiene transversal configurado", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({ id: CURSO_ID, transversalId: null })
    await expect(
      service.listarIntentosPorCurso({
        cursoId: CURSO_ID,
        query: { page: 1, pageSize: 20 },
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("happy: devuelve item ligero con capasCargadas calculado y meta paginada", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({ id: CURSO_ID, transversalId: TRANSVERSAL_ID })
    prisma.$transaction.mockResolvedValueOnce([
      [
        {
          id: INTENTO_ID,
          fecha: new Date("2026-05-18T12:00:00Z"),
          estado: "EN_EVALUACION" as const,
          notaGlobal: null,
          aprobado: null,
          anulado: false,
          notaCapaTests: new Prisma.Decimal(82),
          notaCapaCualitativa: new Prisma.Decimal(75),
          notaCapaComprension: null,
          colaborador: { id: COLABORADOR_ID, nombre: "Lucia", email: "l@nttdata.test" },
        },
      ],
      1,
    ])
    const r = await service.listarIntentosPorCurso({
      cursoId: CURSO_ID,
      query: { page: 1, pageSize: 20 },
    })
    expect(r.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 })
    expect(r.data[0]).toEqual({
      intentoId: INTENTO_ID,
      fecha: "2026-05-18T12:00:00.000Z",
      estado: "EN_EVALUACION",
      notaGlobal: null,
      aprobado: null,
      anulado: false,
      capasCargadas: 2,
      colaborador: { id: COLABORADOR_ID, nombre: "Lucia", email: "l@nttdata.test" },
    })
  })

  it("propaga filtro de busqueda al WHERE (colaborador.nombre OR email, case-insensitive)", async () => {
    prisma.curso.findUnique.mockResolvedValueOnce({ id: CURSO_ID, transversalId: TRANSVERSAL_ID })
    prisma.$transaction.mockResolvedValueOnce([[], 0])
    await service.listarIntentosPorCurso({
      cursoId: CURSO_ID,
      query: { page: 1, pageSize: 20, busqueda: "luc" },
    })
    const findManyArgs = prisma.intentoTransversal.findMany.mock.calls[0]?.[0]
    expect(findManyArgs?.where?.colaborador?.OR).toEqual([
      { nombre: { contains: "luc", mode: "insensitive" } },
      { email: { contains: "luc", mode: "insensitive" } },
    ])
  })
})
