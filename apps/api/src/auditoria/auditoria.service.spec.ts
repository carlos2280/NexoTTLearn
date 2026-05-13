import type { ListarAuditoriaQuery } from "@nexott-learn/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { AuditoriaService } from "./auditoria.service"

interface PrismaMock {
  readonly activityLog: {
    readonly findMany: ReturnType<typeof vi.fn>
    readonly count: ReturnType<typeof vi.fn>
  }
  readonly $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const findMany = vi.fn()
  const count = vi.fn()
  const $transaction = vi.fn((operations: readonly Promise<unknown>[]) => Promise.all(operations))
  return { activityLog: { findMany, count }, $transaction }
}

function buildFilaProyectada(
  overrides: Partial<{
    readonly id: string
    readonly usuarioId: string | null
    readonly accion: string
    readonly recursoTipo: string | null
    readonly recursoId: string | null
    readonly exito: boolean
    readonly metadata: Record<string, unknown> | null
    readonly ip: string | null
    readonly userAgent: string | null
    readonly createdAt: Date
    readonly usuario: { colaborador: { email: string; nombre: string } } | null
  }> = {},
): Record<string, unknown> {
  // `??` con `null` rechazaria el null y aplicaria el default; usamos `in` para
  // permitir null explicito en overrides (caso evento sistema/cron).
  const base: Record<string, unknown> = {
    id: "00000000-0000-0000-0000-000000000001",
    usuarioId: "00000000-0000-0000-0000-000000000010",
    accion: "LOGIN_OK",
    recursoTipo: null,
    recursoId: null,
    exito: true,
    metadata: null,
    ip: "10.0.0.1",
    userAgent: "ua-test",
    createdAt: new Date("2026-05-13T08:00:00.000Z"),
    usuario: { colaborador: { email: "admin@nttdata.test", nombre: "Admin" } },
  }
  return { ...base, ...overrides }
}

function buildQuery(overrides: Partial<ListarAuditoriaQuery> = {}): ListarAuditoriaQuery {
  return {
    page: 1,
    pageSize: 50,
    ...overrides,
  }
}

describe("AuditoriaService.listar", () => {
  let prisma: PrismaMock
  let service: AuditoriaService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new AuditoriaService(prisma as unknown as PrismaService)
  })

  it("paginacion default: page=1 pageSize=50 con skip=0 take=50", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(buildQuery())

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly skip: number
      readonly take: number
      readonly orderBy: { readonly createdAt: "desc" }
    }
    expect(call.skip).toBe(0)
    expect(call.take).toBe(50)
    expect(call.orderBy).toEqual({ createdAt: "desc" })
  })

  it("calcula skip a partir de page (page=3, pageSize=20 -> skip=40)", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(buildQuery({ page: 3, pageSize: 20 }))

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly skip: number
      readonly take: number
    }
    expect(call.skip).toBe(40)
    expect(call.take).toBe(20)
  })

  it("sin filtros where queda vacio", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(buildQuery())

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly where: Record<string, unknown>
    }
    expect(call.where).toEqual({})
  })

  it("filtro actorUsuarioId -> where.usuarioId", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(buildQuery({ actorUsuarioId: "ffffffff-ffff-ffff-ffff-ffffffffffff" }))

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly usuarioId: string }
    }
    expect(call.where.usuarioId).toBe("ffffffff-ffff-ffff-ffff-ffffffffffff")
  })

  it("filtro accion / recursoTipo / recursoId / exito aplicado en where", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(
      buildQuery({
        accion: "LOGIN_FAIL",
        recursoTipo: "ficha",
        recursoId: "11111111-1111-1111-1111-111111111111",
        exito: false,
      }),
    )

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly where: Record<string, unknown>
    }
    expect(call.where).toEqual({
      accion: "LOGIN_FAIL",
      recursoTipo: "ficha",
      recursoId: "11111111-1111-1111-1111-111111111111",
      exito: false,
    })
  })

  it("rango temporal: desde+hasta crean filtro createdAt gte/lt con Date", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(
      buildQuery({
        desde: "2026-05-01T00:00:00.000Z",
        hasta: "2026-05-13T00:00:00.000Z",
      }),
    )

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly createdAt: { readonly gte: Date; readonly lt: Date } }
    }
    expect(call.where.createdAt.gte).toBeInstanceOf(Date)
    expect(call.where.createdAt.lt).toBeInstanceOf(Date)
    expect(call.where.createdAt.gte.toISOString()).toBe("2026-05-01T00:00:00.000Z")
    expect(call.where.createdAt.lt.toISOString()).toBe("2026-05-13T00:00:00.000Z")
  })

  it("rango temporal solo `desde` no setea `lt`", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(buildQuery({ desde: "2026-05-01T00:00:00.000Z" }))

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly where: { readonly createdAt: { readonly gte: Date; readonly lt?: Date } }
    }
    expect(call.where.createdAt.gte).toBeInstanceOf(Date)
    expect(call.where.createdAt.lt).toBeUndefined()
  })

  it("filtros AND combinados (actor + recurso + rango)", async () => {
    prisma.activityLog.findMany.mockResolvedValue([])
    prisma.activityLog.count.mockResolvedValue(0)

    await service.listar(
      buildQuery({
        actorUsuarioId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        recursoTipo: "curso",
        recursoId: "22222222-2222-2222-2222-222222222222",
        desde: "2026-05-01T00:00:00.000Z",
      }),
    )

    const call = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly where: Record<string, unknown>
    }
    expect(call.where.usuarioId).toBe("ffffffff-ffff-ffff-ffff-ffffffffffff")
    expect(call.where.recursoTipo).toBe("curso")
    expect(call.where.recursoId).toBe("22222222-2222-2222-2222-222222222222")
    expect(call.where.createdAt).toBeDefined()
  })

  it("toResumen: join con Usuario+Colaborador proyecta actorEmail/actorNombre", async () => {
    prisma.activityLog.findMany.mockResolvedValue([
      buildFilaProyectada({
        usuario: { colaborador: { email: "carlos@nttdata.test", nombre: "Carlos" } },
      }),
    ])
    prisma.activityLog.count.mockResolvedValue(1)

    const out = await service.listar(buildQuery())

    expect(out.data[0]?.actorEmail).toBe("carlos@nttdata.test")
    expect(out.data[0]?.actorNombre).toBe("Carlos")
  })

  it("evento sistema/cron (usuarioId=null) devuelve actorEmail/Nombre=null", async () => {
    prisma.activityLog.findMany.mockResolvedValue([
      buildFilaProyectada({ usuarioId: null, usuario: null }),
    ])
    prisma.activityLog.count.mockResolvedValue(1)

    const out = await service.listar(buildQuery())

    expect(out.data[0]?.actorUsuarioId).toBeNull()
    expect(out.data[0]?.actorEmail).toBeNull()
    expect(out.data[0]?.actorNombre).toBeNull()
  })

  it("metadata array o primitivos se normaliza a null", async () => {
    prisma.activityLog.findMany.mockResolvedValue([
      buildFilaProyectada({ metadata: ["no", "valido"] as unknown as Record<string, unknown> }),
    ])
    prisma.activityLog.count.mockResolvedValue(1)

    const out = await service.listar(buildQuery())

    expect(out.data[0]?.metadata).toBeNull()
  })

  it("metadata objeto se preserva", async () => {
    prisma.activityLog.findMany.mockResolvedValue([
      buildFilaProyectada({ metadata: { motivo: "test", contadores: { x: 3 } } }),
    ])
    prisma.activityLog.count.mockResolvedValue(1)

    const out = await service.listar(buildQuery())

    expect(out.data[0]?.metadata).toEqual({ motivo: "test", contadores: { x: 3 } })
  })

  it("respuesta paginada contiene meta correcta (total + totalPages)", async () => {
    prisma.activityLog.findMany.mockResolvedValue([buildFilaProyectada()])
    prisma.activityLog.count.mockResolvedValue(123)

    const out = await service.listar(buildQuery({ page: 2, pageSize: 50 }))

    expect(out.meta).toEqual({
      page: 2,
      pageSize: 50,
      total: 123,
      totalPages: 3,
    })
  })
})

describe("AuditoriaService.contar / listarTodas", () => {
  let prisma: PrismaMock
  let service: AuditoriaService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new AuditoriaService(prisma as unknown as PrismaService)
  })

  it("contar invoca count con el mismo where construido", async () => {
    prisma.activityLog.count.mockResolvedValue(7)

    const total = await service.contar({ accion: "LOGIN_FAIL" })

    expect(total).toBe(7)
    const callArg = prisma.activityLog.count.mock.calls[0]?.[0] as {
      readonly where: { readonly accion: string }
    }
    expect(callArg.where.accion).toBe("LOGIN_FAIL")
  })

  it("listarTodas devuelve TODAS sin paginacion (no skip ni take)", async () => {
    prisma.activityLog.findMany.mockResolvedValue([buildFilaProyectada()])

    const filas = await service.listarTodas({ accion: "LOGIN_OK" })

    expect(filas).toHaveLength(1)
    const callArg = prisma.activityLog.findMany.mock.calls[0]?.[0] as {
      readonly skip?: number
      readonly take?: number
      readonly orderBy: { readonly createdAt: "desc" }
    }
    expect(callArg.skip).toBeUndefined()
    expect(callArg.take).toBeUndefined()
    expect(callArg.orderBy).toEqual({ createdAt: "desc" })
  })
})
