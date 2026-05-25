import { Logger } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { PreviewPurgaService } from "./preview-purga.service"

interface PrismaMock {
  previewEvaluacionInicial: { deleteMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    previewEvaluacionInicial: { deleteMany: vi.fn() },
  }
}

describe("PreviewPurgaService.purgarPreviewsCaducados", () => {
  let prisma: PrismaMock
  let service: PreviewPurgaService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new PreviewPurgaService(prisma as unknown as PrismaService)
  })

  it("ejecuta deleteMany con guard aplicadoEn=null y expiraEn<now", async () => {
    prisma.previewEvaluacionInicial.deleteMany.mockResolvedValue({ count: 0 })

    const antes = Date.now()
    await service.purgarPreviewsCaducados()
    const despues = Date.now()

    expect(prisma.previewEvaluacionInicial.deleteMany).toHaveBeenCalledTimes(1)
    const call = prisma.previewEvaluacionInicial.deleteMany.mock.calls[0]?.[0] as {
      where: { aplicadoEn: null; expiraEn: { lt: Date } }
    }
    expect(call.where.aplicadoEn).toBeNull()
    expect(call.where.expiraEn.lt).toBeInstanceOf(Date)
    const ts = call.where.expiraEn.lt.getTime()
    expect(ts).toBeGreaterThanOrEqual(antes)
    expect(ts).toBeLessThanOrEqual(despues)
  })

  it("loggea count cuando hay previews purgados", async () => {
    prisma.previewEvaluacionInicial.deleteMany.mockResolvedValue({ count: 3 })
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {
      /* silencio durante el test */
    })

    await service.purgarPreviewsCaducados()

    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/3/))
    logSpy.mockRestore()
  })

  it("no loggea cuando count = 0", async () => {
    prisma.previewEvaluacionInicial.deleteMany.mockResolvedValue({ count: 0 })
    const logSpy = vi.spyOn(Logger.prototype, "log").mockImplementation(() => {
      /* silencio durante el test */
    })

    await service.purgarPreviewsCaducados()

    expect(logSpy).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })
})
