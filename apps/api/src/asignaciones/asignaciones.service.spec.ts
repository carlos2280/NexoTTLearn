import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import type { Asignacion } from "@nexott-learn/shared-types"
import { EstadoCurso, Prisma, RolAsignacion, RolUsuario } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { AsignacionesService } from "./asignaciones.service"

interface MockPrisma {
  asignacionCurso: {
    findUnique: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  historicoEstadoAsignacion: {
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  curso: {
    findUnique: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  colaborador: { findMany: ReturnType<typeof vi.fn> }
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    asignacionCurso: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    historicoEstadoAsignacion: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    curso: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    colaborador: { findMany: vi.fn() },
    usuario: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(
    (arg: readonly Promise<unknown>[] | ((tx: MockPrisma) => Promise<unknown>)) => {
      if (typeof arg === "function") {
        return arg(mock)
      }
      return Promise.all(arg)
    },
  )
  return mock
}

const ADMIN_ID = "00000000-0000-0000-0000-00000000aaaa"
const PARTICIPANTE_ID = "00000000-0000-0000-0000-00000000bbbb"
const COLABORADOR_ID = "00000000-0000-0000-0000-00000000cccc"
const OTRO_COLABORADOR_ID = "00000000-0000-0000-0000-00000000dddd"
const CURSO_ID = "11111111-1111-1111-1111-111111111111"
const ASIGNACION_ID = "22222222-2222-2222-2222-222222222222"
const FECHA = new Date("2026-05-11T10:00:00Z")

const ADMIN: SesionUsuario = { usuarioId: ADMIN_ID, rol: RolUsuario.ADMIN }
const PARTICIPANTE: SesionUsuario = { usuarioId: PARTICIPANTE_ID, rol: RolUsuario.PARTICIPANTE }

function asignacionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: ASIGNACION_ID,
    colaboradorId: COLABORADOR_ID,
    cursoId: CURSO_ID,
    rol: RolAsignacion.ASIGNADO,
    origenVoluntario: null,
    estadoAsignado: "ASIGNADO",
    estadoVoluntario: null,
    fechaInicio: null,
    fechaCierre: null,
    resultadoEntrevistaCliente: "PENDIENTE",
    createdAt: FECHA,
    updatedAt: FECHA,
    colaborador: { id: COLABORADOR_ID, nombre: "Test Col", email: "test@nttdata.test" },
    ...overrides,
  }
}

interface MockIdempotency {
  runOnce: ReturnType<typeof vi.fn>
}

function buildIdempotencyMock(prisma: MockPrisma): MockIdempotency {
  return {
    runOnce: vi.fn(async (input: { ejecutor: (tx: unknown) => Promise<unknown> }) => {
      const result = (await input.ejecutor(prisma)) as {
        status: number
        body: unknown
      }
      return { status: result.status, body: result.body, replay: false }
    }),
  }
}

let prisma: MockPrisma
let idempotency: MockIdempotency
let service: AsignacionesService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  idempotency = buildIdempotencyMock(prisma)
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: AsignacionesService,
        useFactory: (p: PrismaService, i: IdempotencyService) => new AsignacionesService(p, i),
        inject: [PrismaService, IdempotencyService],
      },
      { provide: PrismaService, useValue: prisma },
      { provide: IdempotencyService, useValue: idempotency },
    ],
  }).compile()
  service = moduleRef.get(AsignacionesService)
})

describe("AsignacionesService.crearBatch", () => {
  beforeEach(() => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.ACTIVO })
  })

  it("clasifica creadas + rechazadas: OK + EX_EMPLEADO + YA_INSCRITO + NO_ENCONTRADO", async () => {
    const idOk1 = "33333333-3333-3333-3333-333333333301"
    const idOk2 = "33333333-3333-3333-3333-333333333302"
    const idEx = "33333333-3333-3333-3333-333333333303"
    const idYa = "33333333-3333-3333-3333-333333333304"
    const idNo = "33333333-3333-3333-3333-333333333305"

    prisma.colaborador.findMany.mockResolvedValue([
      { id: idOk1, estadoEmpleado: "ACTIVO" },
      { id: idOk2, estadoEmpleado: "ACTIVO" },
      { id: idEx, estadoEmpleado: "EX_EMPLEADO" },
      { id: idYa, estadoEmpleado: "ACTIVO" },
    ])
    prisma.asignacionCurso.findMany.mockResolvedValue([{ colaboradorId: idYa }])
    prisma.asignacionCurso.create.mockImplementation((args: { data: { colaboradorId: string } }) =>
      Promise.resolve(asignacionRow({ colaboradorId: args.data.colaboradorId })),
    )

    const res = await service.crearBatch(CURSO_ID, {
      colaboradorIds: [idOk1, idOk2, idEx, idYa, idNo],
    })

    expect(res.creadas).toHaveLength(2)
    expect(res.rechazadas).toEqual(
      expect.arrayContaining([
        { colaboradorId: idEx, motivo: "EX_EMPLEADO" },
        { colaboradorId: idYa, motivo: "YA_INSCRITO" },
        { colaboradorId: idNo, motivo: "NO_ENCONTRADO" },
      ]),
    )
    expect(res.rechazadas).toHaveLength(3)
  })

  it("404 si el curso no existe", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(
      service.crearBatch(CURSO_ID, { colaboradorIds: [COLABORADOR_ID] }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("409 conflictCursoNoActivo si el curso esta CERRADO", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.CERRADO })
    await expect(
      service.crearBatch(CURSO_ID, { colaboradorIds: [COLABORADOR_ID] }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoNoActivo },
    })
  })

  it("trata race P2002 como YA_INSCRITO sin romper el batch", async () => {
    const idOk = "33333333-3333-3333-3333-333333333310"
    const idRace = "33333333-3333-3333-3333-333333333311"
    prisma.colaborador.findMany.mockResolvedValue([
      { id: idOk, estadoEmpleado: "ACTIVO" },
      { id: idRace, estadoEmpleado: "ACTIVO" },
    ])
    prisma.asignacionCurso.findMany.mockResolvedValue([])
    prisma.asignacionCurso.create
      .mockResolvedValueOnce(asignacionRow({ colaboradorId: idOk }))
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("dup", {
          code: "P2002",
          clientVersion: "test",
        }),
      )

    const res = await service.crearBatch(CURSO_ID, { colaboradorIds: [idOk, idRace] })
    expect(res.creadas).toHaveLength(1)
    expect(res.rechazadas).toEqual([{ colaboradorId: idRace, motivo: "YA_INSCRITO" }])
  })
})

describe("AsignacionesService.convertirAAsignado", () => {
  it("M1 race-safe: dos invocaciones concurrentes -> 1 cumplida + 1 rechazada con 409", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoVoluntario: "INSCRITO",
    })
    prisma.asignacionCurso.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ rol: RolAsignacion.ASIGNADO, estadoAsignado: "ASIGNADO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const resultados = await Promise.allSettled([
      service.convertirAAsignado(ASIGNACION_ID, "motivo", ADMIN_ID),
      service.convertirAAsignado(ASIGNACION_ID, "motivo", ADMIN_ID),
    ])
    const cumplidas = resultados.filter((r) => r.status === "fulfilled")
    const rechazadas = resultados.filter((r) => r.status === "rejected")
    expect(cumplidas).toHaveLength(1)
    expect(rechazadas).toHaveLength(1)
    const reason = (rechazadas[0] as PromiseRejectedResult).reason as {
      response?: { code?: string }
    }
    expect(reason.response?.code).toBe(apiErrorCodes.conflictAsignacionNoVoluntario)
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledTimes(1)
  })

  it("404 si la asignacion no existe", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(service.convertirAAsignado(ASIGNACION_ID, "m", ADMIN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("409 conflictAsignacionNoVoluntario si ya estaba en rol ASIGNADO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoVoluntario: null,
    })
    await expect(service.convertirAAsignado(ASIGNACION_ID, "m", ADMIN_ID)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })
})

describe("AsignacionesService.autoInscribir", () => {
  beforeEach(() => {
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
  })

  it("P2002 -> conflictAsignacionDuplicada (no el 409 generico)", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      estado: EstadoCurso.ACTIVO,
      toggleVoluntarios: true,
    })
    prisma.asignacionCurso.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "test",
      }),
    )
    await expect(
      service.autoInscribir(CURSO_ID, { origenVoluntario: "INICIATIVA" }, PARTICIPANTE),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictAsignacionDuplicada },
    })
  })

  it("403 conflictAutoInscripcionDeshabilitada si toggleVoluntarios=false", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      estado: EstadoCurso.ACTIVO,
      toggleVoluntarios: false,
    })
    await expect(
      service.autoInscribir(CURSO_ID, { origenVoluntario: "INICIATIVA" }, PARTICIPANTE),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it("409 conflictCursoNoActivo si curso esta BORRADOR", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      estado: EstadoCurso.BORRADOR,
      toggleVoluntarios: true,
    })
    await expect(
      service.autoInscribir(CURSO_ID, { origenVoluntario: "INICIATIVA" }, PARTICIPANTE),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoNoActivo },
    })
  })

  it("404 colaboradorNoEncontrado si el usuario no tiene colaborador asociado", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null)
    await expect(
      service.autoInscribir(CURSO_ID, { origenVoluntario: "INICIATIVA" }, PARTICIPANTE),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.colaboradorNoEncontrado },
    })
  })

  it("happy path: crea con rol=VOLUNTARIO, estado=INSCRITO, origen=INICIATIVA", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      estado: EstadoCurso.ACTIVO,
      toggleVoluntarios: true,
    })
    prisma.asignacionCurso.create.mockResolvedValue(
      asignacionRow({
        rol: RolAsignacion.VOLUNTARIO,
        estadoAsignado: null,
        estadoVoluntario: "INSCRITO",
        origenVoluntario: "INICIATIVA",
      }),
    )
    const res = await service.autoInscribir(
      CURSO_ID,
      { origenVoluntario: "INICIATIVA" },
      PARTICIPANTE,
    )
    expect(res.rol).toBe("VOLUNTARIO")
    expect(res.estadoVoluntario).toBe("INSCRITO")
    expect(res.origenVoluntario).toBe("INICIATIVA")
  })
})

describe("AsignacionesService.listarPorCurso scope PARTICIPANTE", () => {
  beforeEach(() => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
  })

  it("PARTICIPANTE inscrito: devuelve UNA asignacion (la suya)", async () => {
    // §5.75: la query usa relacion reverse `colaborador.usuario.is.id` para
    // ahorrar el lookup previo de `colaboradorId`. Una sola query a
    // asignacionCurso (+ el guard previo de `curso.findUnique`).
    prisma.asignacionCurso.findFirst.mockResolvedValue(asignacionRow())

    const res = await service.listarPorCurso(CURSO_ID, { page: 1, pageSize: 20 }, PARTICIPANTE)
    expect(res.data).toHaveLength(1)
    expect(res.meta.total).toBe(1)
    expect(prisma.asignacionCurso.findFirst).toHaveBeenCalledWith({
      where: {
        cursoId: CURSO_ID,
        colaborador: { usuario: { is: { id: PARTICIPANTE_ID } } },
      },
      select: expect.anything(),
    })
    expect(prisma.usuario.findUnique).not.toHaveBeenCalled()
  })

  it("PARTICIPANTE no inscrito: devuelve listado vacio (total=0), no 404", async () => {
    prisma.asignacionCurso.findFirst.mockResolvedValue(null)

    const res = await service.listarPorCurso(CURSO_ID, { page: 1, pageSize: 20 }, PARTICIPANTE)
    expect(res.data).toHaveLength(0)
    expect(res.meta.total).toBe(0)
  })

  it("404 si el curso no existe (incluso para PARTICIPANTE)", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(
      service.listarPorCurso(CURSO_ID, { page: 1, pageSize: 20 }, PARTICIPANTE),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("AsignacionesService.obtenerPorId scope PARTICIPANTE", () => {
  it("PARTICIPANTE con asignacion ajena: 404 asignacionNoEncontrada", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      ...asignacionRow({ colaboradorId: OTRO_COLABORADOR_ID }),
      observacionesAdmin: null,
      observacionesCliente: null,
      fechaEntrevistaCliente: null,
      historicoEstados: [],
    })
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })

    await expect(service.obtenerPorId(ASIGNACION_ID, PARTICIPANTE)).rejects.toMatchObject({
      response: { code: apiErrorCodes.asignacionNoEncontrada },
    })
  })

  it("PARTICIPANTE con asignacion propia: devuelve detalle", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      ...asignacionRow(),
      observacionesAdmin: null,
      observacionesCliente: null,
      fechaEntrevistaCliente: null,
      historicoEstados: [],
    })
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    const res = await service.obtenerPorId(ASIGNACION_ID, PARTICIPANTE)
    expect(res.id).toBe(ASIGNACION_ID)
    expect(res.historicoEstados).toEqual([])
  })

  it("ADMIN: devuelve detalle aunque la asignacion sea ajena", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      ...asignacionRow({ colaboradorId: OTRO_COLABORADOR_ID }),
      observacionesAdmin: "obs",
      observacionesCliente: null,
      fechaEntrevistaCliente: null,
      historicoEstados: [],
    })
    const res = await service.obtenerPorId(ASIGNACION_ID, ADMIN)
    expect(res.colaboradorId).toBe(OTRO_COLABORADOR_ID)
    expect(res.observacionesAdmin).toBe("obs")
  })
})

describe("AsignacionesService.listarCursosDisponiblesVoluntario", () => {
  it("excluye cursos donde el participante ya esta inscrito (filtro asignaciones.none)", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    prisma.curso.findMany.mockResolvedValue([
      {
        id: CURSO_ID,
        titulo: "Curso disponible",
        fechaInicio: new Date("2026-06-01T00:00:00Z"),
        fechaDeadline: new Date("2026-08-01T00:00:00Z"),
        cliente: { id: "cliente-id", nombre: "Cliente X" },
        _count: { asignaciones: 5 },
      },
    ])
    prisma.curso.count.mockResolvedValue(1)

    const res = await service.listarCursosDisponiblesVoluntario(
      { page: 1, pageSize: 20 },
      PARTICIPANTE,
    )
    expect(res.data).toHaveLength(1)
    expect(res.data[0]?.voluntariosInscritos).toBe(5)
    expect(res.data[0]?.titulo).toBe("Curso disponible")
    const args = prisma.curso.findMany.mock.calls[0]?.[0] as {
      where: { asignaciones?: { none?: { colaboradorId: string } } }
    }
    expect(args.where.asignaciones?.none?.colaboradorId).toBe(COLABORADOR_ID)
  })

  it("usuario sin colaborador: devuelve listado vacio", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null)
    const res = await service.listarCursosDisponiblesVoluntario(
      { page: 1, pageSize: 20 },
      PARTICIPANTE,
    )
    expect(res.data).toHaveLength(0)
    expect(res.meta.total).toBe(0)
  })
})

// ===== Slice 6 P6b — Transiciones de estado =====

describe("AsignacionesService.iniciarProgreso", () => {
  it("ASIGNADO -> EN_PROGRESO: updateMany count=1, crea historico, marca transiciono=true", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      colaboradorId: COLABORADOR_ID,
      estadoAsignado: "ASIGNADO",
      estadoVoluntario: null,
      fechaInicio: null,
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "EN_PROGRESO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.iniciarProgreso(ASIGNACION_ID, ADMIN)
    expect(res.transiciono).toBe(true)
    expect(res.asignacion.estadoAsignado).toBe("EN_PROGRESO")
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledTimes(1)
  })

  it("idempotencia: ya en EN_PROGRESO -> noop sin historico", async () => {
    // §5.87: `previa` ahora se lee con SELECT_ASIGNACION_FIELDS para
    // devolver la asignacion directamente en la rama noop, sin un segundo
    // SELECT. El mock debe incluir todos los campos del proyeccion.
    prisma.asignacionCurso.findUnique.mockResolvedValue(
      asignacionRow({ estadoAsignado: "EN_PROGRESO", fechaInicio: FECHA }),
    )

    const res = await service.iniciarProgreso(ASIGNACION_ID, ADMIN)
    expect(res.transiciono).toBe(false)
    expect(prisma.historicoEstadoAsignacion.create).not.toHaveBeenCalled()
    expect(prisma.asignacionCurso.updateMany).not.toHaveBeenCalled()
    expect(prisma.asignacionCurso.findUniqueOrThrow).not.toHaveBeenCalled()
  })

  it("404 si la asignacion no existe", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(service.iniciarProgreso(ASIGNACION_ID, ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("scope PARTICIPANTE ajeno: 404 asignacionNoEncontrada", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      colaboradorId: OTRO_COLABORADOR_ID,
      estadoAsignado: "ASIGNADO",
      estadoVoluntario: null,
      fechaInicio: null,
    })
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    await expect(service.iniciarProgreso(ASIGNACION_ID, PARTICIPANTE)).rejects.toMatchObject({
      response: { code: apiErrorCodes.asignacionNoEncontrada },
    })
  })

  it("M1 race-safe: dos invocaciones concurrentes -> 1 cumplida + 1 con 409", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      colaboradorId: COLABORADOR_ID,
      estadoAsignado: "ASIGNADO",
      estadoVoluntario: null,
      fechaInicio: null,
    })
    prisma.asignacionCurso.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "EN_PROGRESO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const resultados = await Promise.allSettled([
      service.iniciarProgreso(ASIGNACION_ID, ADMIN),
      service.iniciarProgreso(ASIGNACION_ID, ADMIN),
    ])
    const cumplidas = resultados.filter((r) => r.status === "fulfilled")
    const rechazadas = resultados.filter((r) => r.status === "rejected")
    expect(cumplidas).toHaveLength(1)
    expect(rechazadas).toHaveLength(1)
    expect(
      ((rechazadas[0] as PromiseRejectedResult).reason as { response?: { code?: string } }).response
        ?.code,
    ).toBe(apiErrorCodes.conflictAsignacionEstado)
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledTimes(1)
  })

  it("VOLUNTARIO INSCRITO -> EN_PROGRESO transiciona", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      colaboradorId: COLABORADOR_ID,
      estadoAsignado: null,
      estadoVoluntario: "INSCRITO",
      fechaInicio: null,
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({
        rol: RolAsignacion.VOLUNTARIO,
        estadoAsignado: null,
        estadoVoluntario: "EN_PROGRESO",
      }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.iniciarProgreso(ASIGNACION_ID, ADMIN)
    expect(res.transiciono).toBe(true)
    expect(res.asignacion.estadoVoluntario).toBe("EN_PROGRESO")
  })
})

describe("AsignacionesService.marcarListo", () => {
  it("happy path: curso sin transversal ni IA, transiciona EN_PROGRESO -> LISTO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      cursoId: CURSO_ID,
      estadoAsignado: "EN_PROGRESO",
      estadoVoluntario: null,
    })
    prisma.curso.findUniqueOrThrow = vi.fn().mockResolvedValue({
      transversalId: null,
      entrevistaIaId: null,
      toggleCierreAutomatico: false,
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "LISTO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.marcarListo(ASIGNACION_ID, ADMIN_ID)
    expect(res.estadoAsignado).toBe("LISTO")
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledTimes(1)
  })

  it("422 condicionesListoNoCumplidas si el curso tiene transversal pendiente", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      cursoId: CURSO_ID,
      estadoAsignado: "EN_PROGRESO",
      estadoVoluntario: null,
    })
    prisma.curso.findUniqueOrThrow = vi.fn().mockResolvedValue({
      transversalId: "trans-id",
      entrevistaIaId: null,
      toggleCierreAutomatico: false,
    })

    await expect(service.marcarListo(ASIGNACION_ID, ADMIN_ID)).rejects.toMatchObject({
      response: {
        code: apiErrorCodes.condicionesListoNoCumplidas,
        details: { faltantes: [{ codigo: "TRANSVERSAL_PENDIENTE" }] },
      },
    })
  })

  it("409 conflictAsignacionEstado si la asignacion no esta EN_PROGRESO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      cursoId: CURSO_ID,
      estadoAsignado: "ASIGNADO",
      estadoVoluntario: null,
    })
    await expect(service.marcarListo(ASIGNACION_ID, ADMIN_ID)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictAsignacionEstado },
    })
  })

  it("M1 race-safe: dos invocaciones concurrentes -> 1 cumplida + 1 con 409", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      cursoId: CURSO_ID,
      estadoAsignado: "EN_PROGRESO",
      estadoVoluntario: null,
    })
    prisma.curso.findUniqueOrThrow = vi.fn().mockResolvedValue({
      transversalId: null,
      entrevistaIaId: null,
      toggleCierreAutomatico: false,
    })
    prisma.asignacionCurso.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "LISTO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const resultados = await Promise.allSettled([
      service.marcarListo(ASIGNACION_ID, ADMIN_ID),
      service.marcarListo(ASIGNACION_ID, ADMIN_ID),
    ])
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1)
    expect(resultados.filter((r) => r.status === "rejected")).toHaveLength(1)
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledTimes(1)
  })
})

describe("AsignacionesService.cerrarCaso", () => {
  const idempKey = "11111111-2222-3333-4444-555555555555"

  it("ASIGNADO con resultado APTO: transiciona y persiste fechaCierre", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "LISTO",
      estadoVoluntario: null,
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "APTO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.cerrarCaso({
      asignacionId: ASIGNACION_ID,
      bodyRaw: { resultado: "APTO" },
      motivo: null,
      idempotencyKey: idempKey,
      autorUsuarioId: ADMIN_ID,
    })
    expect(res.nuevo).toBe(true)
    expect(res.asignacion.estadoAsignado).toBe("APTO")
    expect(idempotency.runOnce).toHaveBeenCalledTimes(1)
  })

  it("VOLUNTARIO: pasa a COMPLETADO sin resultado en body", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoAsignado: null,
      estadoVoluntario: "EN_PROGRESO",
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({
        rol: RolAsignacion.VOLUNTARIO,
        estadoAsignado: null,
        estadoVoluntario: "COMPLETADO",
      }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.cerrarCaso({
      asignacionId: ASIGNACION_ID,
      bodyRaw: {},
      motivo: null,
      idempotencyKey: idempKey,
      autorUsuarioId: ADMIN_ID,
    })
    expect(res.asignacion.estadoVoluntario).toBe("COMPLETADO")
  })

  it("400 invalidBody: ASIGNADO sin resultado en body", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "LISTO",
      estadoVoluntario: null,
    })
    await expect(
      service.cerrarCaso({
        asignacionId: ASIGNACION_ID,
        bodyRaw: {},
        motivo: null,
        idempotencyKey: idempKey,
        autorUsuarioId: ADMIN_ID,
      }),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.invalidBody } })
  })

  it("400 invalidBody: VOLUNTARIO con resultado en body (strict)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoAsignado: null,
      estadoVoluntario: "EN_PROGRESO",
    })
    await expect(
      service.cerrarCaso({
        asignacionId: ASIGNACION_ID,
        bodyRaw: { resultado: "APTO" },
        motivo: null,
        idempotencyKey: idempKey,
        autorUsuarioId: ADMIN_ID,
      }),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.invalidBody } })
  })

  it("409 si la asignacion no esta en LISTO/EN_PROGRESO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "ASIGNADO",
      estadoVoluntario: null,
    })
    // updateMany dentro del runOnce: el guard del estado rechaza con count=0.
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 0 })

    await expect(
      service.cerrarCaso({
        asignacionId: ASIGNACION_ID,
        bodyRaw: { resultado: "APTO" },
        motivo: null,
        idempotencyKey: idempKey,
        autorUsuarioId: ADMIN_ID,
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictAsignacionNoListoNiEnProgreso },
    })
  })

  it("replay idempotente: nuevo=false cuando runOnce devuelve replay=true", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "LISTO",
      estadoVoluntario: null,
    })
    idempotency.runOnce.mockResolvedValueOnce({
      status: 200,
      body: { id: ASIGNACION_ID } as unknown as Asignacion,
      replay: true,
    })

    const res = await service.cerrarCaso({
      asignacionId: ASIGNACION_ID,
      bodyRaw: { resultado: "APTO" },
      motivo: null,
      idempotencyKey: idempKey,
      autorUsuarioId: ADMIN_ID,
    })
    expect(res.nuevo).toBe(false)
  })
})

describe("AsignacionesService.reabrirCaso", () => {
  const idempKey = "22222222-3333-4444-5555-666666666666"

  it("ASIGNADO APTO -> EN_PROGRESO con historico (motivo)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "APTO",
      estadoVoluntario: null,
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "EN_PROGRESO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.reabrirCaso({
      asignacionId: ASIGNACION_ID,
      motivo: "Cliente solicito revisar",
      idempotencyKey: idempKey,
      autorUsuarioId: ADMIN_ID,
    })
    expect(res.nuevo).toBe(true)
    expect(res.asignacion.estadoAsignado).toBe("EN_PROGRESO")
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ motivo: "Cliente solicito revisar" }),
      }),
    )
  })

  it("VOLUNTARIO COMPLETADO -> EN_PROGRESO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoAsignado: null,
      estadoVoluntario: "COMPLETADO",
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({
        rol: RolAsignacion.VOLUNTARIO,
        estadoAsignado: null,
        estadoVoluntario: "EN_PROGRESO",
      }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.reabrirCaso({
      asignacionId: ASIGNACION_ID,
      motivo: "Revisar entrega",
      idempotencyKey: idempKey,
      autorUsuarioId: ADMIN_ID,
    })
    expect(res.asignacion.estadoVoluntario).toBe("EN_PROGRESO")
  })

  it("409 conflictAsignacionNoCerrada si estado origen es ASIGNADO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "ASIGNADO",
      estadoVoluntario: null,
    })
    await expect(
      service.reabrirCaso({
        asignacionId: ASIGNACION_ID,
        motivo: "x",
        idempotencyKey: idempKey,
        autorUsuarioId: ADMIN_ID,
      }),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.conflictAsignacionNoCerrada } })
  })

  it("replay con misma Idempotency-Key tras exito devuelve cache (no 409) aunque estado ya transiciono", async () => {
    // Regresion FIX-P6b: antes la validacion `esCerrado` estaba FUERA del
    // `runOnce`, lo que hacia que un cliente legitimo reintentando con misma
    // key recibiera 409 espurio (estado ya era EN_PROGRESO tras el primer exito).
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "EN_PROGRESO",
      estadoVoluntario: null,
    })
    const cached = { id: ASIGNACION_ID, estadoAsignado: "EN_PROGRESO" } as unknown as Asignacion
    idempotency.runOnce.mockResolvedValueOnce({ status: 200, body: cached, replay: true })

    const res = await service.reabrirCaso({
      asignacionId: ASIGNACION_ID,
      motivo: "reintento",
      idempotencyKey: idempKey,
      autorUsuarioId: ADMIN_ID,
    })
    expect(res.nuevo).toBe(false)
    expect(res.asignacion).toBe(cached)
    expect(prisma.asignacionCurso.updateMany).not.toHaveBeenCalled()
    expect(prisma.historicoEstadoAsignacion.create).not.toHaveBeenCalled()
  })

  it("409 conflictAsignacionNoCerrada se lanza DENTRO del ejecutor sin tocar updateMany", async () => {
    // Verifica que la validacion `esCerrado` esta dentro del callback de
    // `runOnce` (FIX-P6b): el corto-circuito ocurre antes de cualquier
    // updateMany cuando el estado no es cerrado.
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoAsignado: null,
      estadoVoluntario: "EN_PROGRESO",
    })
    await expect(
      service.reabrirCaso({
        asignacionId: ASIGNACION_ID,
        motivo: "x",
        idempotencyKey: idempKey,
        autorUsuarioId: ADMIN_ID,
      }),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.conflictAsignacionNoCerrada } })
    expect(idempotency.runOnce).toHaveBeenCalledTimes(1)
    expect(prisma.asignacionCurso.updateMany).not.toHaveBeenCalled()
    expect(prisma.historicoEstadoAsignacion.create).not.toHaveBeenCalled()
  })

  it("M1 race-safe: dos invocaciones concurrentes -> 1 cumplida + 1 con 409 conflictAsignacionNoCerrada", async () => {
    // §5.86: simetria con los race-tests heredados de cerrar-caso (§5.41).
    // El guard `updateMany WHERE estadoAsignado IN (APTO,NO_APTO)` garantiza
    // que solo el primer writer transiciona; el segundo recibe count===0 y
    // lanza `conflictAsignacionNoCerrada`. Idempotency-keys distintas para
    // que ambos lleguen al ejecutor del `runOnce` (sin cache hit).
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "APTO",
      estadoVoluntario: null,
    })
    prisma.asignacionCurso.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "EN_PROGRESO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const resultados = await Promise.allSettled([
      service.reabrirCaso({
        asignacionId: ASIGNACION_ID,
        motivo: "reapertura 1",
        idempotencyKey: "aaaaaaaa-1111-1111-1111-111111111111",
        autorUsuarioId: ADMIN_ID,
      }),
      service.reabrirCaso({
        asignacionId: ASIGNACION_ID,
        motivo: "reapertura 2",
        idempotencyKey: "bbbbbbbb-2222-2222-2222-222222222222",
        autorUsuarioId: ADMIN_ID,
      }),
    ])
    const cumplidas = resultados.filter((r) => r.status === "fulfilled")
    const rechazadas = resultados.filter((r) => r.status === "rejected")
    expect(cumplidas).toHaveLength(1)
    expect(rechazadas).toHaveLength(1)
    expect(
      ((rechazadas[0] as PromiseRejectedResult).reason as { response?: { code?: string } }).response
        ?.code,
    ).toBe(apiErrorCodes.conflictAsignacionNoCerrada)
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledTimes(1)
  })
})

describe("AsignacionesService.retirar", () => {
  it("ASIGNADO en EN_PROGRESO -> RETIRADO con motivo en historico", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "EN_PROGRESO",
      estadoVoluntario: null,
    })
    prisma.asignacionCurso.updateMany.mockResolvedValue({ count: 1 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "RETIRADO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const res = await service.retirar(ASIGNACION_ID, "Renuncia voluntaria", ADMIN_ID)
    expect(res.estadoAsignado).toBe("RETIRADO")
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ motivo: "Renuncia voluntaria" }) }),
    )
  })

  it("409 si la asignacion ya esta RETIRADA", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "RETIRADO",
      estadoVoluntario: null,
    })
    await expect(service.retirar(ASIGNACION_ID, "x", ADMIN_ID)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictAsignacionEstado },
    })
  })

  it("404 si la asignacion no existe", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(service.retirar(ASIGNACION_ID, "x", ADMIN_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("M1 race-safe: dos invocaciones concurrentes -> 1 cumplida + 1 con 409 conflictAsignacionEstado", async () => {
    // §5.86: simetria con los race-tests heredados. `retirar` no usa
    // Idempotency-Key (cap. 12.1: operacion final unica). El guard
    // `updateMany WHERE estadoAsignado != "RETIRADO"` deja pasar solo al
    // primer writer; el segundo recibe count===0 y lanza
    // `conflictAsignacionEstado`.
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "EN_PROGRESO",
      estadoVoluntario: null,
    })
    prisma.asignacionCurso.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    prisma.asignacionCurso.findUniqueOrThrow.mockResolvedValue(
      asignacionRow({ estadoAsignado: "RETIRADO" }),
    )
    prisma.historicoEstadoAsignacion.create.mockResolvedValue({})

    const resultados = await Promise.allSettled([
      service.retirar(ASIGNACION_ID, "Renuncia 1", ADMIN_ID),
      service.retirar(ASIGNACION_ID, "Renuncia 2", ADMIN_ID),
    ])
    const cumplidas = resultados.filter((r) => r.status === "fulfilled")
    const rechazadas = resultados.filter((r) => r.status === "rejected")
    expect(cumplidas).toHaveLength(1)
    expect(rechazadas).toHaveLength(1)
    expect(
      ((rechazadas[0] as PromiseRejectedResult).reason as { response?: { code?: string } }).response
        ?.code,
    ).toBe(apiErrorCodes.conflictAsignacionEstado)
    expect(prisma.historicoEstadoAsignacion.create).toHaveBeenCalledTimes(1)
  })
})

// ===== Slice 6 P6c — Resultado entrevista cliente + historico paginado =====

describe("AsignacionesService.registrarResultadoEntrevistaCliente", () => {
  it("200 PASO con rol=ASIGNADO + estadoAsignado=APTO: campos opcionales null", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "APTO",
    })
    prisma.asignacionCurso.update.mockResolvedValue(
      asignacionRow({
        estadoAsignado: "APTO",
        resultadoEntrevistaCliente: "PASO",
      }),
    )

    const res = await service.registrarResultadoEntrevistaCliente(ASIGNACION_ID, {
      resultadoEntrevistaCliente: "PASO",
    })
    expect(res.resultadoEntrevistaCliente).toBe("PASO")
    expect(prisma.asignacionCurso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ASIGNACION_ID },
        data: expect.objectContaining({
          resultadoEntrevistaCliente: "PASO",
          observacionesCliente: null,
          fechaEntrevistaCliente: null,
        }),
      }),
    )
  })

  it("200 NO_PASO con rol=ASIGNADO + estadoAsignado=NO_APTO + observaciones + fecha", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "NO_APTO",
    })
    prisma.asignacionCurso.update.mockResolvedValue(
      asignacionRow({
        estadoAsignado: "NO_APTO",
        resultadoEntrevistaCliente: "NO_PASO",
      }),
    )

    await service.registrarResultadoEntrevistaCliente(ASIGNACION_ID, {
      resultadoEntrevistaCliente: "NO_PASO",
      observacionesCliente: "cliente prefirio otro",
      fechaEntrevistaCliente: "2026-04-15",
    })
    const updateCall = prisma.asignacionCurso.update.mock.calls[0]?.[0] as {
      data: {
        resultadoEntrevistaCliente: string
        observacionesCliente: string
        fechaEntrevistaCliente: Date
      }
    }
    expect(updateCall.data.resultadoEntrevistaCliente).toBe("NO_PASO")
    expect(updateCall.data.observacionesCliente).toBe("cliente prefirio otro")
    expect(updateCall.data.fechaEntrevistaCliente.toISOString()).toBe("2026-04-15T00:00:00.000Z")
  })

  it("422 validacionResultadoSoloAsignado cuando rol=VOLUNTARIO (sin tocar update)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.VOLUNTARIO,
      estadoAsignado: null,
    })
    await expect(
      service.registrarResultadoEntrevistaCliente(ASIGNACION_ID, {
        resultadoEntrevistaCliente: "PASO",
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.validacionResultadoSoloAsignado },
    })
    expect(prisma.asignacionCurso.update).not.toHaveBeenCalled()
  })

  it("422 validacionAsignacionNoCerrada cuando rol=ASIGNADO + estadoAsignado=EN_PROGRESO", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      rol: RolAsignacion.ASIGNADO,
      estadoAsignado: "EN_PROGRESO",
    })
    await expect(
      service.registrarResultadoEntrevistaCliente(ASIGNACION_ID, {
        resultadoEntrevistaCliente: "PASO",
      }),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.validacionAsignacionNoCerrada },
    })
    expect(prisma.asignacionCurso.update).not.toHaveBeenCalled()
  })

  it("404 asignacionNoEncontrada cuando findUnique devuelve null", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(
      service.registrarResultadoEntrevistaCliente(ASIGNACION_ID, {
        resultadoEntrevistaCliente: "PASO",
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("AsignacionesService.obtenerHistoricoEstados", () => {
  function historicoRow(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      fecha: FECHA,
      estadoAnterior: "ASIGNADO:ASIGNADO",
      estadoNuevo: "ASIGNADO:EN_PROGRESO",
      motivo: null,
      ...overrides,
    }
  }

  it("ADMIN: devuelve historico paginado de cualquier asignacion", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      colaboradorId: OTRO_COLABORADOR_ID,
    })
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([
      historicoRow(),
      historicoRow({ estadoNuevo: "ASIGNADO:APTO", motivo: "ok" }),
    ])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(2)

    const res = await service.obtenerHistoricoEstados(
      ASIGNACION_ID,
      { page: 1, pageSize: 20 },
      ADMIN,
    )
    expect(res.data).toHaveLength(2)
    expect(res.meta.total).toBe(2)
    expect(prisma.historicoEstadoAsignacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { asignacionId: ASIGNACION_ID },
        orderBy: { fecha: "desc" },
        skip: 0,
        take: 20,
      }),
    )
  })

  it("PARTICIPANTE propio: obtiene su historico", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      colaboradorId: COLABORADOR_ID,
    })
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([historicoRow()])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(1)

    const res = await service.obtenerHistoricoEstados(
      ASIGNACION_ID,
      { page: 1, pageSize: 20 },
      PARTICIPANTE,
    )
    expect(res.data).toHaveLength(1)
    expect(res.data[0]?.estadoNuevo).toBe("ASIGNADO:EN_PROGRESO")
  })

  it("PARTICIPANTE ajeno: 404 asignacionNoEncontrada (D-AS-9, NO 403)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      colaboradorId: OTRO_COLABORADOR_ID,
    })
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })

    await expect(
      service.obtenerHistoricoEstados(ASIGNACION_ID, { page: 1, pageSize: 20 }, PARTICIPANTE),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.asignacionNoEncontrada } })
    expect(prisma.historicoEstadoAsignacion.findMany).not.toHaveBeenCalled()
  })

  it("404 asignacionNoEncontrada cuando la asignacion no existe", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(
      service.obtenerHistoricoEstados(ASIGNACION_ID, { page: 1, pageSize: 20 }, ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("paginacion page=2, pageSize=10: skip=10, take=10, total del count", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValue({
      id: ASIGNACION_ID,
      colaboradorId: COLABORADOR_ID,
    })
    prisma.historicoEstadoAsignacion.findMany.mockResolvedValue([])
    prisma.historicoEstadoAsignacion.count.mockResolvedValue(42)

    const res = await service.obtenerHistoricoEstados(
      ASIGNACION_ID,
      { page: 2, pageSize: 10 },
      ADMIN,
    )
    expect(res.meta.total).toBe(42)
    expect(res.meta.page).toBe(2)
    expect(prisma.historicoEstadoAsignacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    )
  })
})
