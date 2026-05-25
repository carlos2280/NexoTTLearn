import { TipoReporteCache } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { ReporteCacheService } from "./reporte-cache.service"

interface PrismaMock {
  reporteCache: {
    findUnique: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
  }
  consultaLog: {
    findMany: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return {
    reporteCache: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue(undefined),
    },
    consultaLog: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  }
}

describe("ReporteCacheService", () => {
  let prisma: PrismaMock
  let service: ReporteCacheService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new ReporteCacheService(prisma as unknown as PrismaService)
  })

  describe("calcularScopeHash", () => {
    it("es deterministico para el mismo scope", () => {
      const a = service.calcularScopeHash({ clienteId: "x", desde: "2026-01-01" })
      const b = service.calcularScopeHash({ clienteId: "x", desde: "2026-01-01" })
      expect(a).toEqual(b)
    })

    it("ignora el orden de las claves", () => {
      const a = service.calcularScopeHash({ desde: "2026-01-01", clienteId: "x" })
      const b = service.calcularScopeHash({ clienteId: "x", desde: "2026-01-01" })
      expect(a).toEqual(b)
    })

    it("distingue scopes con valores distintos", () => {
      const a = service.calcularScopeHash({ clienteId: "x" })
      const b = service.calcularScopeHash({ clienteId: "y" })
      expect(a).not.toEqual(b)
    })
  })

  describe("obtener", () => {
    it("devuelve null cuando no existe la fila", async () => {
      prisma.reporteCache.findUnique.mockResolvedValueOnce(null)
      const res = await service.obtener(TipoReporteCache.EFICACIA_PLATAFORMA, { a: 1 })
      expect(res).toBeNull()
    })

    it("devuelve null cuando frescura > 24h", async () => {
      prisma.reporteCache.findUnique.mockResolvedValueOnce({
        tipo: TipoReporteCache.EFICACIA_PLATAFORMA,
        payload: { hola: "mundo" },
        generadaAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      })
      const res = await service.obtener(TipoReporteCache.EFICACIA_PLATAFORMA, { a: 1 })
      expect(res).toBeNull()
    })

    it("devuelve payload + frescura cuando esta fresco", async () => {
      const generadaAt = new Date(Date.now() - 60_000)
      prisma.reporteCache.findUnique.mockResolvedValueOnce({
        tipo: TipoReporteCache.EFICACIA_PLATAFORMA,
        payload: { metrica: 42 },
        generadaAt,
      })
      const res = await service.obtener<{ metrica: number }>(TipoReporteCache.EFICACIA_PLATAFORMA, {
        a: 1,
      })
      expect(res?.payload).toEqual({ metrica: 42 })
      expect(res?.frescura).toEqual(generadaAt)
    })

    it("descarta hit con tipo distinto al solicitado (mismo scopeHash)", async () => {
      prisma.reporteCache.findUnique.mockResolvedValueOnce({
        tipo: TipoReporteCache.HISTORICO_CLIENTE,
        payload: { hola: "mundo" },
        generadaAt: new Date(),
      })
      const res = await service.obtener(TipoReporteCache.EFICACIA_PLATAFORMA, { a: 1 })
      expect(res).toBeNull()
    })
  })

  describe("guardar", () => {
    it("hace upsert por scope_hash y devuelve frescura + hash", async () => {
      const { frescura, scopeHash } = await service.guardar(
        TipoReporteCache.EFICACIA_PLATAFORMA,
        { a: 1 },
        { value: "payload" },
      )
      expect(prisma.reporteCache.upsert).toHaveBeenCalledTimes(1)
      expect(frescura).toBeInstanceOf(Date)
      expect(scopeHash).toHaveLength(64)
    })
  })

  describe("listarTopScopesActivos", () => {
    it("dedupe por scopeHash", async () => {
      prisma.consultaLog.findMany.mockResolvedValueOnce([
        { queryParams: { clienteId: "x" } },
        { queryParams: { clienteId: "x" } },
        { queryParams: { clienteId: "y" } },
      ])
      const res = await service.listarTopScopesActivos("/reportes/eficacia-plataforma", 10)
      expect(res).toHaveLength(2)
    })
  })
})
