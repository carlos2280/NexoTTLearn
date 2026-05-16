import { Logger } from "@nestjs/common"
import { TipoReporteCache } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ReporteCacheCron } from "./reporte-cache.cron"
import { ReporteCacheService } from "./reporte-cache.service"
import { ReportesService } from "./reportes.service"

interface CacheMock {
  listarTopScopesActivos: ReturnType<typeof vi.fn>
}

interface ReportesMock {
  recalcularYGuardarPorTipo: ReturnType<typeof vi.fn>
}

describe("ReporteCacheCron.ejecutar", () => {
  let cache: CacheMock
  let reportes: ReportesMock
  let cron: ReporteCacheCron

  beforeEach(() => {
    cache = { listarTopScopesActivos: vi.fn().mockResolvedValue([]) }
    reportes = { recalcularYGuardarPorTipo: vi.fn().mockResolvedValue(undefined) }
    cron = new ReporteCacheCron(
      cache as unknown as ReporteCacheService,
      reportes as unknown as ReportesService,
    )
  })

  it("itera los 4 tipos sin fallar cuando no hay scopes", async () => {
    await expect(cron.ejecutar()).resolves.toBeUndefined()
    expect(cache.listarTopScopesActivos).toHaveBeenCalledTimes(
      Object.values(TipoReporteCache).length,
    )
  })

  it("invoca recalcularYGuardarPorTipo por cada scope encontrado", async () => {
    cache.listarTopScopesActivos
      .mockResolvedValueOnce([{ scopeHash: "h1", queryParams: { a: 1 } }])
      .mockResolvedValue([])

    await cron.ejecutar()

    expect(reportes.recalcularYGuardarPorTipo).toHaveBeenCalledWith(
      TipoReporteCache.EFICACIA_PLATAFORMA,
      { a: 1 },
    )
  })

  it("no propaga error si una iteracion falla — loggea con error", async () => {
    cache.listarTopScopesActivos
      .mockResolvedValueOnce([{ scopeHash: "h1", queryParams: {} }])
      .mockResolvedValue([])
    reportes.recalcularYGuardarPorTipo.mockRejectedValueOnce(new Error("kaboom"))
    const errSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => {
      /* silencio */
    })

    await expect(cron.ejecutar()).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})
