import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { HistorialService } from "./historial.service"

const CURSO_ID = "11111111-1111-1111-1111-111111111111"

interface PrismaMock {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  cargaEvaluacionInicial: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  const cargas = {
    findMany: vi.fn(),
    count: vi.fn(),
  }
  return {
    curso: { findUnique: vi.fn() },
    cargaEvaluacionInicial: cargas,
    // El service usa `$transaction([find, count])` (array, no callback).
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  }
}

function build(): { service: HistorialService; prisma: PrismaMock } {
  const prisma = buildPrismaMock()
  const service = new HistorialService(prisma as unknown as PrismaService)
  return { service, prisma }
}

function cargaRow(id: string, createdAt: Date, nombreOriginal: string | null = null) {
  return {
    id,
    previewId: `prev-${id}`,
    archivoId: `arch-${id}`,
    createdAt,
    skillsActualizadas: 10,
    colaboradoresActualizados: 5,
    aplicadoPor: {
      id: "usr-admin",
      colaborador: { nombre: "Admin Demo" },
    },
    archivo: {
      metadata: nombreOriginal === null ? null : { nombreOriginal },
    },
  }
}

describe("HistorialService", () => {
  let h: ReturnType<typeof build>

  beforeEach(() => {
    h = build()
  })

  it("happy path: lista paginada ordenada por createdAt DESC", async () => {
    h.prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    const c1 = cargaRow("carga-1", new Date("2026-05-10T10:00:00Z"))
    const c2 = cargaRow("carga-2", new Date("2026-05-11T10:00:00Z"), "x.xlsx")
    h.prisma.cargaEvaluacionInicial.findMany.mockResolvedValue([c2, c1])
    h.prisma.cargaEvaluacionInicial.count.mockResolvedValue(2)

    const result = await h.service.listar(CURSO_ID, { page: 1, pageSize: 20 })

    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 })
    expect(result.data).toHaveLength(2)
    expect(result.data[0]?.cargaId).toBe("carga-2")
    expect(result.data[0]?.nombreOriginal).toBe("x.xlsx")
    expect(result.data[0]?.aplicadoPor.nombre).toBe("Admin Demo")
    expect(result.data[1]?.nombreOriginal).toBeNull()
    // Verifica orderBy
    const findManyCall = h.prisma.cargaEvaluacionInicial.findMany.mock.calls[0]?.[0] as {
      orderBy: { createdAt: string }
    }
    expect(findManyCall.orderBy).toEqual({ createdAt: "desc" })
  })

  it("curso no existe: 404 CURSO_NO_ENCONTRADO sin tocar BD de cargas", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(null)
    await expect(h.service.listar(CURSO_ID, { page: 1, pageSize: 20 })).rejects.toThrow(
      NotFoundException,
    )
    expect(h.prisma.cargaEvaluacionInicial.findMany).not.toHaveBeenCalled()
  })

  it("paginacion: skip/take derivados de page/pageSize", async () => {
    h.prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    h.prisma.cargaEvaluacionInicial.findMany.mockResolvedValue([])
    h.prisma.cargaEvaluacionInicial.count.mockResolvedValue(0)
    await h.service.listar(CURSO_ID, { page: 3, pageSize: 25 })
    const call = h.prisma.cargaEvaluacionInicial.findMany.mock.calls[0]?.[0] as {
      skip: number
      take: number
    }
    expect(call.skip).toBe(50)
    expect(call.take).toBe(25)
  })

  it("curso sin cargas: data vacia y total=0", async () => {
    h.prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    h.prisma.cargaEvaluacionInicial.findMany.mockResolvedValue([])
    h.prisma.cargaEvaluacionInicial.count.mockResolvedValue(0)
    const result = await h.service.listar(CURSO_ID, { page: 1, pageSize: 20 })
    expect(result.data).toEqual([])
    expect(result.meta.total).toBe(0)
    expect(result.meta.totalPages).toBe(0)
  })

  it("metadata sin nombreOriginal: devuelve null (no crashea)", async () => {
    h.prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
    const c = cargaRow("carga-1", new Date(), null)
    h.prisma.cargaEvaluacionInicial.findMany.mockResolvedValue([c])
    h.prisma.cargaEvaluacionInicial.count.mockResolvedValue(1)
    const result = await h.service.listar(CURSO_ID, { page: 1, pageSize: 20 })
    expect(result.data[0]?.nombreOriginal).toBeNull()
  })
})
