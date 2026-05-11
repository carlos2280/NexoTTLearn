import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { Test, TestingModule } from "@nestjs/testing"
import {
  AccionLogCurso,
  DesbloqueoCurso,
  EstadoCurso,
  EstadoModulo,
  RolUsuario,
} from "@prisma/client"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { CursosService } from "./cursos.service"

interface MockPrisma {
  curso: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findUniqueOrThrow: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  cliente: { findFirst: ReturnType<typeof vi.fn> }
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { findUnique: ReturnType<typeof vi.fn> }
  cursoAreaExigida: {
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  cursoSkillExigida: {
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  cursoModuloHabilitado: {
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
  modulo: { findMany: ReturnType<typeof vi.fn> }
  seccionSkill: { findMany: ReturnType<typeof vi.fn> }
  skill: { findMany: ReturnType<typeof vi.fn> }
  proyectoTransversal: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  transversalSkill: {
    findMany: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
  intentoTransversal: { count: ReturnType<typeof vi.fn> }
  entrevistaIA: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  rubricaEntrevistaIA: {
    findMany: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  intentoEntrevistaIA: { count: ReturnType<typeof vi.fn> }
  logCambioCurso: {
    create: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): MockPrisma {
  const mock: MockPrisma = {
    curso: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cliente: { findFirst: vi.fn() },
    usuario: { findUnique: vi.fn() },
    asignacionCurso: { findUnique: vi.fn() },
    cursoAreaExigida: { createMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn() },
    cursoSkillExigida: { createMany: vi.fn(), deleteMany: vi.fn(), update: vi.fn() },
    cursoModuloHabilitado: { createMany: vi.fn(), deleteMany: vi.fn() },
    modulo: { findMany: vi.fn() },
    seccionSkill: { findMany: vi.fn() },
    skill: { findMany: vi.fn() },
    proyectoTransversal: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    transversalSkill: { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    intentoTransversal: { count: vi.fn() },
    entrevistaIA: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    rubricaEntrevistaIA: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    intentoEntrevistaIA: { count: vi.fn() },
    logCambioCurso: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
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
const CLIENTE_ID = "11111111-1111-1111-1111-111111111111"
const CURSO_ID = "22222222-2222-2222-2222-222222222222"
const FECHA = new Date("2026-01-01T00:00:00Z")

const ADMIN_SESION: SesionUsuario = { usuarioId: ADMIN_ID, rol: RolUsuario.ADMIN }
const PARTICIPANTE_SESION: SesionUsuario = {
  usuarioId: PARTICIPANTE_ID,
  rol: RolUsuario.PARTICIPANTE,
}

function decimal(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n)
}

function buildCursoDetalleRow(overrides: Partial<{ estado: EstadoCurso; titulo: string }> = {}) {
  return {
    id: CURSO_ID,
    titulo: overrides.titulo ?? "Curso Test",
    clienteId: CLIENTE_ID,
    estado: overrides.estado ?? EstadoCurso.BORRADOR,
    fechaInicio: new Date("2026-04-01T00:00:00Z"),
    fechaDeadline: new Date("2026-06-30T00:00:00Z"),
    fechaCierre: null,
    toggleVoluntarios: true,
    toggleCierreAutomatico: false,
    umbralNoCumple: decimal(10),
    pesoBloques: decimal(70),
    pesoTransversal: decimal(20),
    pesoEntrevista: decimal(10),
    transversalId: null,
    entrevistaIaId: null,
    desbloqueo: DesbloqueoCurso.ENCADENADO,
    fechaDesbloqueo: null,
    createdAt: FECHA,
    updatedAt: FECHA,
    areasExigidas: [],
    skillsExigidas: [],
    modulosHabilitados: [],
  }
}

function buildCursoResumenRow(overrides: Partial<{ estado: EstadoCurso; titulo: string }> = {}) {
  const d = buildCursoDetalleRow(overrides)
  return {
    id: d.id,
    titulo: d.titulo,
    clienteId: d.clienteId,
    estado: d.estado,
    fechaInicio: d.fechaInicio,
    fechaDeadline: d.fechaDeadline,
    fechaCierre: d.fechaCierre,
    toggleVoluntarios: d.toggleVoluntarios,
    desbloqueo: d.desbloqueo,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

let prisma: MockPrisma
let service: CursosService
let moduleRef: TestingModule

beforeEach(async () => {
  prisma = buildPrismaMock()
  // Nota H-2: Vitest+esbuild NO preserva `emitDecoratorMetadata`, por lo que
  // `Test.createTestingModule({ providers: [CursosService, ...] })` falla en
  // runtime al intentar resolver `PrismaService` (no hay `design:paramtypes`).
  // El `useFactory` explicito es la unica forma que funciona aqui sin instalar
  // `@swc/core` + `unplugin-swc`. Mantener hasta que se introduzca SWC en CI.
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: CursosService,
        useFactory: (p: PrismaService) => new CursosService(p),
        inject: [PrismaService],
      },
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile()
  service = moduleRef.get(CursosService)
})

describe("CursosService.listar", () => {
  const baseQuery = {
    page: 1,
    pageSize: 20,
    incluirArchivados: false,
    sort: "createdAt" as const,
  }

  it("ADMIN: por defecto excluye ARCHIVADO y respeta clienteId", async () => {
    prisma.curso.findMany.mockResolvedValue([buildCursoResumenRow()])
    prisma.curso.count.mockResolvedValue(1)
    const res = await service.listar({ ...baseQuery, clienteId: CLIENTE_ID }, ADMIN_SESION)
    expect(res.data).toHaveLength(1)
    // biome-ignore lint/style/useNamingConvention: claves Prisma (AND).
    const args = prisma.curso.findMany.mock.calls[0]?.[0] as { where: { AND: unknown[] } }
    expect(args.where.AND).toEqual(
      expect.arrayContaining([
        { clienteId: CLIENTE_ID },
        { estado: { not: EstadoCurso.ARCHIVADO } },
      ]),
    )
  })

  it("ADMIN: incluirArchivados=true no aplica filtro de exclusión", async () => {
    prisma.curso.findMany.mockResolvedValue([])
    prisma.curso.count.mockResolvedValue(0)
    await service.listar({ ...baseQuery, incluirArchivados: true }, ADMIN_SESION)
    const args = prisma.curso.findMany.mock.calls[0]?.[0] as {
      // biome-ignore lint/style/useNamingConvention: claves Prisma (AND).
      where: { AND?: readonly unknown[] }
    }
    const filtros: readonly unknown[] = args.where.AND ?? []
    for (const f of filtros) {
      expect(f).not.toEqual({ estado: { not: EstadoCurso.ARCHIVADO } })
    }
  })

  it("PARTICIPANTE: aplica scope por asignación o ACTIVO+toggleVoluntarios", async () => {
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    prisma.curso.findMany.mockResolvedValue([])
    prisma.curso.count.mockResolvedValue(0)
    await service.listar(baseQuery, PARTICIPANTE_SESION)
    // biome-ignore lint/style/useNamingConvention: claves Prisma (AND).
    const args = prisma.curso.findMany.mock.calls[0]?.[0] as { where: { AND: unknown[] } }
    const scopeFilter = args.where.AND.find(
      (f) => typeof f === "object" && f !== null && "OR" in (f as Record<string, unknown>),
      // biome-ignore lint/style/useNamingConvention: claves Prisma (OR).
    ) as { OR: unknown[] }
    expect(scopeFilter.OR).toHaveLength(2)
  })
})

describe("CursosService.obtenerDetalle", () => {
  it("404 cuando no existe", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(service.obtenerDetalle(CURSO_ID, ADMIN_SESION)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("PARTICIPANTE sin asignación y curso no público: 404", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoDetalleRow({ estado: EstadoCurso.BORRADOR }),
    )
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLABORADOR_ID })
    prisma.asignacionCurso.findUnique.mockResolvedValue(null)
    await expect(service.obtenerDetalle(CURSO_ID, PARTICIPANTE_SESION)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("PARTICIPANTE con curso ACTIVO+toggleVoluntarios: lo devuelve", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoDetalleRow({ estado: EstadoCurso.ACTIVO }))
    const detalle = await service.obtenerDetalle(CURSO_ID, PARTICIPANTE_SESION)
    expect(detalle.id).toBe(CURSO_ID)
  })
})

describe("CursosService.crear", () => {
  it("persiste curso + log dentro del mismo tx", async () => {
    prisma.cliente.findFirst.mockResolvedValue({ id: CLIENTE_ID })
    prisma.curso.create.mockResolvedValue(buildCursoDetalleRow())
    const detalle = await service.crear(
      {
        titulo: "Nuevo",
        clienteId: CLIENTE_ID,
        fechaInicio: "2026-04-01",
        fechaDeadline: "2026-06-30",
      },
      ADMIN_ID,
    )
    expect(detalle.id).toBe(CURSO_ID)
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accion: AccionLogCurso.OTRO,
          motivo: "Creación",
        }),
      }),
    )
  })

  it("rechaza fechas inválidas con 422", async () => {
    await expect(
      service.crear(
        {
          titulo: "X",
          clienteId: CLIENTE_ID,
          fechaInicio: "2026-06-30",
          fechaDeadline: "2026-04-01",
        },
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException)
  })

  it("DESDE_FECHA sin fechaDesbloqueo: 422", async () => {
    prisma.cliente.findFirst.mockResolvedValue({ id: CLIENTE_ID })
    await expect(
      service.crear(
        {
          titulo: "X",
          clienteId: CLIENTE_ID,
          fechaInicio: "2026-04-01",
          fechaDeadline: "2026-06-30",
          desbloqueo: "DESDE_FECHA",
        },
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.validacionCursoFechas } })
  })

  it("cliente no existe: 404", async () => {
    prisma.cliente.findFirst.mockResolvedValue(null)
    await expect(
      service.crear(
        {
          titulo: "X",
          clienteId: CLIENTE_ID,
          fechaInicio: "2026-04-01",
          fechaDeadline: "2026-06-30",
        },
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("CursosService.actualizar", () => {
  it("rechaza con 409 si estado != BORRADOR", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      estado: EstadoCurso.ACTIVO,
      fechaInicio: new Date("2026-04-01"),
      fechaDeadline: new Date("2026-06-30"),
      fechaDesbloqueo: null,
      desbloqueo: DesbloqueoCurso.ENCADENADO,
    })
    await expect(
      service.actualizar(CURSO_ID, { titulo: "Otro" }, undefined, ADMIN_ID),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it("previewSolo=true no escribe log ni hace update", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      estado: EstadoCurso.BORRADOR,
      fechaInicio: new Date("2026-04-01"),
      fechaDeadline: new Date("2026-06-30"),
      fechaDesbloqueo: null,
      desbloqueo: DesbloqueoCurso.ENCADENADO,
    })
    prisma.curso.findUniqueOrThrow.mockResolvedValue(buildCursoDetalleRow())
    await service.actualizar(CURSO_ID, { titulo: "Otro", previewSolo: true }, undefined, ADMIN_ID)
    expect(prisma.curso.update).not.toHaveBeenCalled()
    expect(prisma.logCambioCurso.create).not.toHaveBeenCalled()
  })

  it("update normal escribe log con motivo del header o 'Edición'", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      estado: EstadoCurso.BORRADOR,
      fechaInicio: new Date("2026-04-01"),
      fechaDeadline: new Date("2026-06-30"),
      fechaDesbloqueo: null,
      desbloqueo: DesbloqueoCurso.ENCADENADO,
    })
    prisma.curso.update.mockResolvedValue(buildCursoDetalleRow({ titulo: "Otro" }))
    await service.actualizar(CURSO_ID, { titulo: "Otro" }, undefined, ADMIN_ID)
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ motivo: "Edición" }),
      }),
    )
  })
})

describe("CursosService.eliminar", () => {
  it("hard delete solo en BORRADOR", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.BORRADOR })
    prisma.logCambioCurso.deleteMany.mockResolvedValue({ count: 1 })
    prisma.curso.delete.mockResolvedValue({ id: CURSO_ID })
    await service.eliminar(CURSO_ID)
    expect(prisma.curso.delete).toHaveBeenCalledWith({ where: { id: CURSO_ID } })
  })

  it("rechaza con 409 si curso no está en BORRADOR", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.ACTIVO })
    await expect(service.eliminar(CURSO_ID)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoNoBorrador },
    })
  })

  it("404 si curso no existe (releído en tx)", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(service.eliminar(CURSO_ID)).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("CursosService.archivar", () => {
  it("solo desde CERRADO: pasa a ARCHIVADO y escribe log", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.CERRADO })
    prisma.curso.update.mockResolvedValue(buildCursoDetalleRow({ estado: EstadoCurso.ARCHIVADO }))
    await service.archivar(CURSO_ID, "Motivo válido", ADMIN_ID)
    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: EstadoCurso.ARCHIVADO } }),
    )
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accion: AccionLogCurso.ARCHIVADO,
          motivo: "Motivo válido",
        }),
      }),
    )
  })

  it("rechaza con 409 si curso no está CERRADO", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.BORRADOR })
    await expect(service.archivar(CURSO_ID, "x", ADMIN_ID)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoNoCerrado },
    })
  })
})

describe("CursosService.desarchivar", () => {
  it("solo desde ARCHIVADO: pasa a CERRADO", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.ARCHIVADO })
    prisma.curso.update.mockResolvedValue(buildCursoDetalleRow({ estado: EstadoCurso.CERRADO }))
    await service.desarchivar(CURSO_ID, ADMIN_ID)
    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: EstadoCurso.CERRADO } }),
    )
  })

  it("rechaza con 409 si no está ARCHIVADO", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID, estado: EstadoCurso.ACTIVO })
    await expect(service.desarchivar(CURSO_ID, ADMIN_ID)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoNoArchivado },
    })
  })
})

describe("CursosService.duplicar", () => {
  const newCursoId = "33333333-3333-3333-3333-333333333333"
  const modActivoId = "44444444-4444-4444-4444-444444444444"
  const modArchivoId = "55555555-5555-5555-5555-555555555555"

  function fuenteCon(modulos: { moduloId: string; estado: EstadoModulo; titulo: string }[]) {
    return {
      id: CURSO_ID,
      clienteId: CLIENTE_ID,
      fechaInicio: new Date("2026-04-01"),
      fechaDeadline: new Date("2026-06-30"),
      toggleVoluntarios: true,
      toggleCierreAutomatico: false,
      umbralNoCumple: decimal(10),
      pesoBloques: decimal(70),
      pesoTransversal: decimal(20),
      pesoEntrevista: decimal(10),
      desbloqueo: DesbloqueoCurso.ENCADENADO,
      fechaDesbloqueo: null,
      areasExigidas: [],
      skillsExigidas: [],
      modulosHabilitados: modulos.map((m) => ({
        moduloId: m.moduloId,
        modulo: { id: m.moduloId, titulo: m.titulo, estado: m.estado },
      })),
    }
  }

  it("excluye módulos ARCHIVADO y devuelve modulosExcluidos", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      fuenteCon([
        { moduloId: modActivoId, estado: EstadoModulo.ACTIVO, titulo: "M activo" },
        { moduloId: modArchivoId, estado: EstadoModulo.ARCHIVADO, titulo: "M archivado" },
      ]),
    )
    prisma.curso.create.mockResolvedValue({ id: newCursoId })
    prisma.curso.findUniqueOrThrow.mockResolvedValue({
      ...buildCursoDetalleRow(),
      id: newCursoId,
      titulo: "Nuevo",
    })
    const res = await service.duplicar(
      CURSO_ID,
      { tituloNuevo: "Nuevo" },
      "motivo duplicar",
      ADMIN_ID,
    )
    expect(res.modulosExcluidos).toEqual([{ moduloId: modArchivoId, titulo: "M archivado" }])
    expect(prisma.cursoModuloHabilitado.createMany).toHaveBeenCalledWith({
      data: [{ cursoId: newCursoId, moduloId: modActivoId }],
    })
  })

  it("rechaza con 409 si TODOS los módulos están ARCHIVADO", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      fuenteCon([{ moduloId: modArchivoId, estado: EstadoModulo.ARCHIVADO, titulo: "X" }]),
    )
    await expect(
      service.duplicar(CURSO_ID, { tituloNuevo: "Nuevo" }, "motivo", ADMIN_ID),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictModuloArchivadoNoDuplicable },
    })
  })

  it("404 si curso fuente no existe", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(
      service.duplicar(CURSO_ID, { tituloNuevo: "X" }, "motivo", ADMIN_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("CursosService.listarLogCambios", () => {
  it("404 si curso no existe", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(
      service.listarLogCambios(CURSO_ID, { page: 1, pageSize: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("happy path: pagina y ordena por fecha desc", async () => {
    prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    prisma.logCambioCurso.findMany.mockResolvedValue([])
    prisma.logCambioCurso.count.mockResolvedValue(0)
    const res = await service.listarLogCambios(CURSO_ID, { page: 1, pageSize: 20 })
    expect(res.meta.page).toBe(1)
    expect(prisma.logCambioCurso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { fecha: "desc" },
        where: { cursoId: CURSO_ID },
      }),
    )
  })
})

describe("CursosService scope PARTICIPANTE sin colaborador asociado", () => {
  it("listar: ForbiddenException si usuario no tiene colaborador", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null)
    await expect(
      service.listar(
        { page: 1, pageSize: 20, incluirArchivados: false, sort: "createdAt" as const },
        PARTICIPANTE_SESION,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})

// =============================================================================
// P4b — Configuracion del curso
// =============================================================================

const AREA_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
const AREA_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
const SKILL_X = "00000000-1111-1111-1111-111111111111"
const SKILL_Y = "00000000-2222-2222-2222-222222222222"
const MOD_A = "00000000-3333-3333-3333-333333333333"
const MOD_B = "00000000-4444-4444-4444-444444444444"

function buildCursoConfigRow(
  overrides: Partial<{
    estado: EstadoCurso
    areasExigidas: ReadonlyArray<{ areaId: string; peso: number; puntajeObjetivo: number }>
    skillsExigidas: ReadonlyArray<{ skillId: string; notaMinima: number }>
    modulosHabilitados: ReadonlyArray<{ moduloId: string }>
    transversalId: string | null
    entrevistaIaId: string | null
    umbralesLogro: Prisma.JsonValue | null
  }> = {},
) {
  const base = buildCursoDetalleRow({ estado: overrides.estado ?? EstadoCurso.BORRADOR })
  return {
    ...base,
    transversalId: overrides.transversalId ?? null,
    entrevistaIaId: overrides.entrevistaIaId ?? null,
    umbralesLogro: overrides.umbralesLogro ?? null,
    areasExigidas: (overrides.areasExigidas ?? []).map((a) => ({
      areaId: a.areaId,
      peso: decimal(a.peso),
      puntajeObjetivo: decimal(a.puntajeObjetivo),
    })),
    skillsExigidas: (overrides.skillsExigidas ?? []).map((s) => ({
      skillId: s.skillId,
      notaMinima: decimal(s.notaMinima),
    })),
    modulosHabilitados: (overrides.modulosHabilitados ?? []).map((m) => ({ moduloId: m.moduloId })),
  }
}

describe("CursosService.actualizarAreas", () => {
  it("BORRADOR: persiste el set y escribe log CAMBIO_AREAS sin exigir motivo", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.BORRADOR }))
    prisma.curso.findUniqueOrThrow.mockResolvedValue(
      buildCursoConfigRow({
        estado: EstadoCurso.BORRADOR,
        areasExigidas: [
          { areaId: AREA_A, peso: 60, puntajeObjetivo: 70 },
          { areaId: AREA_B, peso: 40, puntajeObjetivo: 70 },
        ],
      }),
    )
    const res = await service.actualizarAreas(
      CURSO_ID,
      {
        areas: [
          { areaId: AREA_A, peso: 60, puntajeObjetivo: 70 },
          { areaId: AREA_B, peso: 40, puntajeObjetivo: 70 },
        ],
      },
      undefined,
      ADMIN_ID,
    )
    expect(res.areasExigidas).toHaveLength(2)
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accion: AccionLogCurso.CAMBIO_AREAS }),
      }),
    )
  })

  it("rechaza 422 cuando la suma de pesos != 100", async () => {
    await expect(
      service.actualizarAreas(
        CURSO_ID,
        { areas: [{ areaId: AREA_A, peso: 50, puntajeObjetivo: 60 }] },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.validacionPesoNoSuma100 },
    })
  })

  it("ACTIVO sin motivo: 422 motivoRequerido", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.ACTIVO }))
    await expect(
      service.actualizarAreas(
        CURSO_ID,
        {
          areas: [
            { areaId: AREA_A, peso: 60, puntajeObjetivo: 70 },
            { areaId: AREA_B, peso: 40, puntajeObjetivo: 70 },
          ],
        },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.motivoRequerido } })
  })

  it("ARCHIVADO: 409 conflictCursoEstado", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({ estado: EstadoCurso.ARCHIVADO }),
    )
    await expect(
      service.actualizarAreas(
        CURSO_ID,
        {
          areas: [
            { areaId: AREA_A, peso: 60, puntajeObjetivo: 70 },
            { areaId: AREA_B, peso: 40, puntajeObjetivo: 70 },
          ],
        },
        "motivo",
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.conflictCursoEstado } })
  })

  it("404 cuando el curso no existe (releido en tx)", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(
      service.actualizarAreas(
        CURSO_ID,
        { areas: [{ areaId: AREA_A, peso: 100, puntajeObjetivo: 70 }] },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe("CursosService.actualizarSkillsExigidas", () => {
  it("ACTIVO con motivo: pasa y emite aviso skillsSinCobertura cuando aplica", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({
        estado: EstadoCurso.ACTIVO,
        skillsExigidas: [{ skillId: SKILL_X, notaMinima: 70 }],
        modulosHabilitados: [{ moduloId: MOD_A }],
      }),
    )
    // SKILL_Y no esta cubierta por MOD_A (sin filas en seccionSkill).
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([{ id: SKILL_Y, etiquetaVisible: "Y" }])
    prisma.curso.findUniqueOrThrow.mockResolvedValue(
      buildCursoConfigRow({
        estado: EstadoCurso.ACTIVO,
        skillsExigidas: [{ skillId: SKILL_Y, notaMinima: 70 }],
        modulosHabilitados: [{ moduloId: MOD_A }],
      }),
    )
    const res = await service.actualizarSkillsExigidas(
      CURSO_ID,
      { skills: [{ skillId: SKILL_Y, notaMinima: 70 }] },
      "Cambio de plan",
      ADMIN_ID,
    )
    expect(res.skillsSinCobertura).toEqual([{ skillId: SKILL_Y, etiquetaVisible: "Y" }])
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accion: AccionLogCurso.CAMBIO_OBJETIVOS }),
      }),
    )
  })

  it("ACTIVO sin motivo: 422", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.ACTIVO }))
    await expect(
      service.actualizarSkillsExigidas(CURSO_ID, { skills: [] }, undefined, ADMIN_ID),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.motivoRequerido } })
  })
})

describe("CursosService.actualizarModulosHabilitados", () => {
  it("BORRADOR: aviso D82 no bloquea, devuelve skillsSinCobertura", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({
        estado: EstadoCurso.BORRADOR,
        skillsExigidas: [{ skillId: SKILL_X, notaMinima: 70 }],
        modulosHabilitados: [{ moduloId: MOD_A }],
      }),
    )
    prisma.modulo.findMany.mockResolvedValue([{ id: MOD_B, estado: "ACTIVO", titulo: "M B" }])
    // SKILL_X no se ensena en MOD_B; queda sin cobertura.
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([{ id: SKILL_X, etiquetaVisible: "X" }])
    prisma.curso.findUniqueOrThrow.mockResolvedValue(
      buildCursoConfigRow({
        estado: EstadoCurso.BORRADOR,
        skillsExigidas: [{ skillId: SKILL_X, notaMinima: 70 }],
        modulosHabilitados: [{ moduloId: MOD_B }],
      }),
    )
    const res = await service.actualizarModulosHabilitados(
      CURSO_ID,
      { moduloIds: [MOD_B] },
      undefined,
      ADMIN_ID,
    )
    expect(res.skillsSinCobertura).toEqual([{ skillId: SKILL_X, etiquetaVisible: "X" }])
    expect(prisma.cursoModuloHabilitado.createMany).toHaveBeenCalled()
  })

  it("ACTIVO: D82 bloquea con 422 cuando skill exigida queda sin cobertura", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({
        estado: EstadoCurso.ACTIVO,
        skillsExigidas: [{ skillId: SKILL_X, notaMinima: 70 }],
        modulosHabilitados: [{ moduloId: MOD_A }],
      }),
    )
    prisma.modulo.findMany.mockResolvedValue([])
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([{ id: SKILL_X, etiquetaVisible: "X" }])
    await expect(
      service.actualizarModulosHabilitados(CURSO_ID, { moduloIds: [] }, "Razon valida", ADMIN_ID),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.validacionSkillSinCobertura } })
  })

  it("Rechaza 409 al habilitar un modulo ARCHIVADO (D79)", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.BORRADOR }))
    prisma.modulo.findMany.mockResolvedValue([{ id: MOD_A, estado: "ARCHIVADO", titulo: "Vieja" }])
    await expect(
      service.actualizarModulosHabilitados(CURSO_ID, { moduloIds: [MOD_A] }, undefined, ADMIN_ID),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictModuloArchivadoNoHabilitable },
    })
  })
})

describe("CursosService.actualizarPesos", () => {
  it("BORRADOR: actualiza pesos validos (suma 100)", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.BORRADOR }))
    prisma.curso.findUniqueOrThrow.mockResolvedValue(buildCursoConfigRow())
    await service.actualizarPesos(
      CURSO_ID,
      { pesoBloques: 50, pesoTransversal: 30, pesoEntrevista: 20 },
      undefined,
      ADMIN_ID,
    )
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accion: AccionLogCurso.CAMBIO_PESOS }),
      }),
    )
  })

  it("Rechaza 422 cuando los pesos no suman 100", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.BORRADOR }))
    await expect(
      service.actualizarPesos(
        CURSO_ID,
        { pesoBloques: 50, pesoTransversal: 30, pesoEntrevista: 30 },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.validacionPesoNoSuma100 } })
  })

  it("Solo umbralNoCumple: no exige re-validar suma de pesos", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.BORRADOR }))
    prisma.curso.findUniqueOrThrow.mockResolvedValue(buildCursoConfigRow())
    await service.actualizarPesos(CURSO_ID, { umbralNoCumple: 25 }, undefined, ADMIN_ID)
    expect(prisma.curso.update).toHaveBeenCalled()
  })
})

describe("CursosService.actualizarUmbralesLogro", () => {
  it("Acepta null para reset a defaults", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.BORRADOR }))
    prisma.curso.findUniqueOrThrow.mockResolvedValue(buildCursoConfigRow())
    await service.actualizarUmbralesLogro(CURSO_ID, { umbralesLogro: null }, undefined, ADMIN_ID)
    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ umbralesLogro: Prisma.JsonNull }),
      }),
    )
  })

  it("Rechaza 422 si rompe monotonia (excelencia < solido)", async () => {
    await expect(
      service.actualizarUmbralesLogro(
        CURSO_ID,
        { umbralesLogro: { excelencia: 50, solido: 70, enDesarrollo: 30 } },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.validacionUmbralesLogroMonotonia },
    })
  })
})

describe("CursosService.actualizarTransversal", () => {
  it("Activacion lazy: crea ProyectoTransversal + setea Curso.transversalId", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({ estado: EstadoCurso.BORRADOR, transversalId: null }),
    )
    prisma.proyectoTransversal.create.mockResolvedValue({ id: "t1" })
    prisma.curso.findUniqueOrThrow.mockResolvedValue(buildCursoConfigRow())
    await service.actualizarTransversal(
      CURSO_ID,
      {
        activo: true,
        descripcion: "Proyecto X",
        umbralAprobacion: 70,
        pesoCapaTests: 40,
        pesoCapaCualitativa: 30,
        pesoCapaComprension: 30,
        skillsQueMideIds: [SKILL_X],
      },
      undefined,
      ADMIN_ID,
    )
    expect(prisma.proyectoTransversal.create).toHaveBeenCalled()
    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { transversalId: "t1" } }),
    )
    expect(prisma.transversalSkill.createMany).toHaveBeenCalled()
  })

  it("Desactivacion con intentos: 409", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({ estado: EstadoCurso.BORRADOR, transversalId: "t1" }),
    )
    prisma.intentoTransversal.count.mockResolvedValue(2)
    await expect(
      service.actualizarTransversal(CURSO_ID, { activo: false }, undefined, ADMIN_ID),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictTransversalConIntentos },
    })
  })

  it("Pesos de capas != 100: 422", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildCursoConfigRow({ estado: EstadoCurso.BORRADOR }))
    await expect(
      service.actualizarTransversal(
        CURSO_ID,
        {
          activo: true,
          pesoCapaTests: 50,
          pesoCapaCualitativa: 30,
          pesoCapaComprension: 30,
        },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.validacionPesoNoSuma100 } })
  })
})

describe("CursosService.actualizarEntrevistaIa", () => {
  it("Activacion lazy: crea EntrevistaIA + setea entrevistaIaId", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({ estado: EstadoCurso.BORRADOR, entrevistaIaId: null }),
    )
    prisma.entrevistaIA.create.mockResolvedValue({ id: "e1" })
    prisma.curso.findUniqueOrThrow.mockResolvedValue(buildCursoConfigRow())
    await service.actualizarEntrevistaIa(
      CURSO_ID,
      {
        activo: true,
        duracionMinutos: 30,
        rubrica: [
          { areaId: AREA_A, peso: 60 },
          { areaId: AREA_B, peso: 40 },
        ],
      },
      undefined,
      ADMIN_ID,
    )
    expect(prisma.entrevistaIA.create).toHaveBeenCalled()
    expect(prisma.rubricaEntrevistaIA.createMany).toHaveBeenCalled()
  })

  it("duracionMinutos invalida: 422", async () => {
    await expect(
      service.actualizarEntrevistaIa(
        CURSO_ID,
        { activo: true, duracionMinutos: 20 },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.validacionDuracionEntrevistaInvalida },
    })
  })

  it("Desactivacion con intentos: 409", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildCursoConfigRow({ estado: EstadoCurso.BORRADOR, entrevistaIaId: "e1" }),
    )
    prisma.intentoEntrevistaIA.count.mockResolvedValue(1)
    await expect(
      service.actualizarEntrevistaIa(CURSO_ID, { activo: false }, undefined, ADMIN_ID),
    ).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictEntrevistaConIntentos },
    })
  })

  it("Rubrica != 100: 422", async () => {
    await expect(
      service.actualizarEntrevistaIa(
        CURSO_ID,
        {
          activo: true,
          rubrica: [
            { areaId: AREA_A, peso: 60 },
            { areaId: AREA_B, peso: 30 },
          ],
        },
        undefined,
        ADMIN_ID,
      ),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.validacionPesoNoSuma100 } })
  })
})

// =============================================================================
// P4c — Publicacion BORRADOR -> ACTIVO (D63, D-CUR-9)
// =============================================================================

interface PublicarOverrides {
  estado?: EstadoCurso
  clienteId?: string | null
  fechaInicio?: Date
  fechaDeadline?: Date
  fechaDesbloqueo?: Date | null
  desbloqueo?: DesbloqueoCurso
  pesoBloques?: number
  pesoTransversal?: number
  pesoEntrevista?: number
  areasExigidas?: ReadonlyArray<{ areaId: string; peso: number; puntajeObjetivo: number }>
  skillsExigidas?: ReadonlyArray<{ skillId: string }>
  modulosHabilitados?: ReadonlyArray<{ moduloId: string }>
  transversal?: {
    umbralAprobacion?: number
    pesoCapaTests?: number
    pesoCapaCualitativa?: number
    pesoCapaComprension?: number
  } | null
  entrevistaIA?: {
    umbralAprobacion?: number
    duracionMinutos?: number
    rubrica?: ReadonlyArray<{ areaId: string; peso: number }>
  } | null
}

function buildSnapshotRow(overrides: PublicarOverrides = {}) {
  const transversal = overrides.transversal
  const entrevistaIA = overrides.entrevistaIA
  return {
    id: CURSO_ID,
    estado: overrides.estado ?? EstadoCurso.BORRADOR,
    clienteId: overrides.clienteId === undefined ? CLIENTE_ID : overrides.clienteId,
    fechaInicio: overrides.fechaInicio ?? new Date("2026-04-01T00:00:00Z"),
    fechaDeadline: overrides.fechaDeadline ?? new Date("2026-06-30T00:00:00Z"),
    fechaDesbloqueo: overrides.fechaDesbloqueo ?? null,
    desbloqueo: overrides.desbloqueo ?? DesbloqueoCurso.ENCADENADO,
    pesoBloques: decimal(overrides.pesoBloques ?? 70),
    pesoTransversal: decimal(overrides.pesoTransversal ?? 20),
    pesoEntrevista: decimal(overrides.pesoEntrevista ?? 10),
    areasExigidas: (
      overrides.areasExigidas ?? [
        { areaId: AREA_A, peso: 60, puntajeObjetivo: 70 },
        { areaId: AREA_B, peso: 40, puntajeObjetivo: 70 },
      ]
    ).map((a) => ({
      areaId: a.areaId,
      peso: decimal(a.peso),
      puntajeObjetivo: decimal(a.puntajeObjetivo),
    })),
    skillsExigidas: overrides.skillsExigidas ?? [],
    modulosHabilitados: overrides.modulosHabilitados ?? [],
    transversal: transversal
      ? {
          umbralAprobacion: decimal(transversal.umbralAprobacion ?? 70),
          pesoCapaTests: decimal(transversal.pesoCapaTests ?? 40),
          pesoCapaCualitativa: decimal(transversal.pesoCapaCualitativa ?? 30),
          pesoCapaComprension: decimal(transversal.pesoCapaComprension ?? 30),
        }
      : null,
    entrevistaIA: entrevistaIA
      ? {
          umbralAprobacion: decimal(entrevistaIA.umbralAprobacion ?? 70),
          duracionMinutos: entrevistaIA.duracionMinutos ?? 30,
          rubrica: (entrevistaIA.rubrica ?? [{ areaId: AREA_A, peso: 100 }]).map((r) => ({
            areaId: r.areaId,
            peso: decimal(r.peso),
          })),
        }
      : null,
  }
}

function mockSnapshotValido(overrides: PublicarOverrides = {}): void {
  prisma.curso.findUnique.mockResolvedValue(buildSnapshotRow(overrides))
  prisma.seccionSkill.findMany.mockResolvedValue([])
  prisma.skill.findMany.mockResolvedValue([])
  prisma.curso.findUniqueOrThrow.mockResolvedValue(
    buildCursoConfigRow({ estado: EstadoCurso.ACTIVO }),
  )
}

describe("CursosService.publicarCurso", () => {
  it("happy path: BORRADOR con D63 OK pasa a ACTIVO y persiste log PUBLICACION (motivo default)", async () => {
    mockSnapshotValido()
    const res = await service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)
    expect(res.estado).toBe(EstadoCurso.ACTIVO)
    expect(prisma.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CURSO_ID },
        data: { estado: EstadoCurso.ACTIVO },
      }),
    )
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cursoId: CURSO_ID,
          autorUsuarioId: ADMIN_ID,
          accion: AccionLogCurso.PUBLICACION,
          motivo: "Publicación",
        }),
      }),
    )
  })

  it("motivo custom: se persiste tal cual en el log", async () => {
    mockSnapshotValido()
    await service.publicarCurso(CURSO_ID, ADMIN_ID, "Lanzamiento Q2")
    expect(prisma.logCambioCurso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ motivo: "Lanzamiento Q2" }),
      }),
    )
  })

  it("curso no existe: 404 cursoNoEncontrado", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: { code: apiErrorCodes.cursoNoEncontrado },
    })
  })

  it("estado ACTIVO: 409 conflictCursoEstado (idempotencia)", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildSnapshotRow({ estado: EstadoCurso.ACTIVO }))
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoEstado },
    })
    expect(prisma.curso.update).not.toHaveBeenCalled()
  })

  it("estado CERRADO: 409 conflictCursoEstado", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildSnapshotRow({ estado: EstadoCurso.CERRADO }))
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoEstado },
    })
  })

  it("estado ARCHIVADO: 409 conflictCursoEstado", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildSnapshotRow({ estado: EstadoCurso.ARCHIVADO }))
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoEstado },
    })
  })

  it("D63#1 cliente null: 422 con clienteNoEncontrado en validacionesFallidas", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildSnapshotRow({ clienteId: null }))
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        code: apiErrorCodes.conflictCursoNoPublicable,
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({ codigo: apiErrorCodes.clienteNoEncontrado }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#2 areas vacias: 422 contexto AREAS", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildSnapshotRow({ areasExigidas: [] }))
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        code: apiErrorCodes.conflictCursoNoPublicable,
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({
              codigo: apiErrorCodes.validacionPesoNoSuma100,
              detalles: expect.objectContaining({ contexto: "AREAS" }) as unknown,
            }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#3 puntajeObjetivo fuera de rango: 422 validacionAreaPuntajeObjetivoFueraDeRango", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({
        areasExigidas: [
          { areaId: AREA_A, peso: 60, puntajeObjetivo: 70 },
          { areaId: AREA_B, peso: 40, puntajeObjetivo: 120 },
        ],
      }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        code: apiErrorCodes.conflictCursoNoPublicable,
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({
              codigo: apiErrorCodes.validacionAreaPuntajeObjetivoFueraDeRango,
            }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#4 skill exigida sin cobertura D82: 422 validacionSkillSinCobertura", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({
        skillsExigidas: [{ skillId: SKILL_X }],
        modulosHabilitados: [{ moduloId: MOD_A }],
      }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([{ id: SKILL_X, etiquetaVisible: "X" }])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        code: apiErrorCodes.conflictCursoNoPublicable,
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({ codigo: apiErrorCodes.validacionSkillSinCobertura }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#5 pesos intra-skill != 100: 422 contexto PESOS_INTRA_SKILL", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({ pesoBloques: 50, pesoTransversal: 30, pesoEntrevista: 30 }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({
              codigo: apiErrorCodes.validacionPesoNoSuma100,
              detalles: expect.objectContaining({ contexto: "PESOS_INTRA_SKILL" }) as unknown,
            }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#6 transversal activo con capas != 100: 422 contexto CAPAS_TRANSVERSAL", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({
        transversal: { pesoCapaTests: 50, pesoCapaCualitativa: 30, pesoCapaComprension: 30 },
      }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({
              codigo: apiErrorCodes.validacionPesoNoSuma100,
              detalles: expect.objectContaining({ contexto: "CAPAS_TRANSVERSAL" }) as unknown,
            }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#7 entrevista IA activa con rubrica != 100: 422 contexto RUBRICA_ENTREVISTA", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({
        entrevistaIA: { rubrica: [{ areaId: AREA_A, peso: 60 }] },
      }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({
              codigo: apiErrorCodes.validacionPesoNoSuma100,
              detalles: expect.objectContaining({ contexto: "RUBRICA_ENTREVISTA" }) as unknown,
            }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#7 entrevista IA con duracion invalida: 422 validacionDuracionEntrevistaInvalida", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({ entrevistaIA: { duracionMinutos: 20 } }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({
              codigo: apiErrorCodes.validacionDuracionEntrevistaInvalida,
            }),
          ]) as unknown,
        },
      },
    })
  })

  it("D63#8 fechas invalidas (inicio >= deadline): 422 validacionCursoFechas", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({
        fechaInicio: new Date("2026-07-01T00:00:00Z"),
        fechaDeadline: new Date("2026-04-01T00:00:00Z"),
      }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: {
        details: {
          validacionesFallidas: expect.arrayContaining([
            expect.objectContaining({ codigo: apiErrorCodes.validacionCursoFechas }),
          ]) as unknown,
        },
      },
    })
  })

  it("acumulacion: 3 fallas simultaneas vienen las 3 en details.validacionesFallidas", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      buildSnapshotRow({
        clienteId: null,
        areasExigidas: [],
        pesoBloques: 50,
        pesoTransversal: 30,
        pesoEntrevista: 30,
      }),
    )
    prisma.seccionSkill.findMany.mockResolvedValue([])
    prisma.skill.findMany.mockResolvedValue([])
    interface DetallesCapturados {
      readonly validacionesFallidas: readonly { readonly codigo: string }[]
    }
    let captured: DetallesCapturados | null = null
    try {
      await service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)
    } catch (error) {
      const e = error as { response?: { details?: DetallesCapturados } }
      captured = e.response?.details ?? null
    }
    expect(captured).not.toBeNull()
    const codigos = captured?.validacionesFallidas.map((v) => v.codigo) ?? []
    expect(codigos).toContain(apiErrorCodes.clienteNoEncontrado)
    expect(codigos).toContain(apiErrorCodes.validacionPesoNoSuma100)
    expect(codigos.length).toBeGreaterThanOrEqual(3)
  })

  it("race: si el findUnique en tx ve estado ACTIVO (otro admin publico antes), 409", async () => {
    prisma.curso.findUnique.mockResolvedValue(buildSnapshotRow({ estado: EstadoCurso.ACTIVO }))
    await expect(service.publicarCurso(CURSO_ID, ADMIN_ID, undefined)).rejects.toMatchObject({
      response: { code: apiErrorCodes.conflictCursoEstado },
    })
    expect(prisma.curso.update).not.toHaveBeenCalled()
    expect(prisma.logCambioCurso.create).not.toHaveBeenCalled()
  })
})
