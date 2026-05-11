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
  cliente: {
    findFirst: ReturnType<typeof vi.fn>
  }
  usuario: {
    findUnique: ReturnType<typeof vi.fn>
  }
  asignacionCurso: {
    findUnique: ReturnType<typeof vi.fn>
  }
  cursoAreaExigida: {
    createMany: ReturnType<typeof vi.fn>
  }
  cursoSkillExigida: {
    createMany: ReturnType<typeof vi.fn>
  }
  cursoModuloHabilitado: {
    createMany: ReturnType<typeof vi.fn>
  }
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
    cursoAreaExigida: { createMany: vi.fn() },
    cursoSkillExigida: { createMany: vi.fn() },
    cursoModuloHabilitado: { createMany: vi.fn() },
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
