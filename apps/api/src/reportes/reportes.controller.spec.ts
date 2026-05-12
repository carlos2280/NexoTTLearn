import { UnprocessableEntityException } from "@nestjs/common"
import {
  avanceCursoQuerySchema,
  brechasDetectadasQuerySchema,
  centroRevisionQuerySchema,
  detalleColaboradorQuerySchema,
} from "@nexott-learn/shared-types"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ExportService } from "../common/export/export.service"
import { ConsultasLogService } from "./consultas-log.service"
import { ReportesController } from "./reportes.controller"
import { ReportesService } from "./reportes.service"

interface ServiceMock {
  obtenerAvanceCurso: ReturnType<typeof vi.fn>
  obtenerDetalleColaborador: ReturnType<typeof vi.fn>
  obtenerBrechasDetectadas: ReturnType<typeof vi.fn>
  obtenerCentroRevision: ReturnType<typeof vi.fn>
}

function buildServiceMock(): ServiceMock {
  return {
    obtenerAvanceCurso: vi.fn(),
    obtenerDetalleColaborador: vi.fn(),
    obtenerBrechasDetectadas: vi.fn(),
    obtenerCentroRevision: vi.fn(),
  }
}

const CURSO_ID = "11111111-1111-1111-1111-111111111111"
const COLAB_ID = "22222222-2222-2222-2222-222222222222"

describe("ReportesController — schemas Zod por endpoint", () => {
  it("avanceCursoQuerySchema rechaza cursoId no UUID", () => {
    const result = avanceCursoQuerySchema.safeParse({ cursoId: "no-es-uuid" })
    expect(result.success).toBe(false)
  })

  it("avanceCursoQuerySchema acepta vista=ACTUAL por defecto", () => {
    const result = avanceCursoQuerySchema.safeParse({ cursoId: CURSO_ID })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vista).toBe("ACTUAL")
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(20)
    }
  })

  it("avanceCursoQuerySchema rechaza vista invalida", () => {
    const result = avanceCursoQuerySchema.safeParse({
      cursoId: CURSO_ID,
      vista: "FUTURO",
    })
    expect(result.success).toBe(false)
  })

  it("avanceCursoQuerySchema rechaza pageSize > 100", () => {
    const result = avanceCursoQuerySchema.safeParse({
      cursoId: CURSO_ID,
      pageSize: 500,
    })
    expect(result.success).toBe(false)
  })

  it("detalleColaboradorQuerySchema exige cursoId + colaboradorId", () => {
    const ok = detalleColaboradorQuerySchema.safeParse({
      cursoId: CURSO_ID,
      colaboradorId: COLAB_ID,
    })
    expect(ok.success).toBe(true)
    const sinColab = detalleColaboradorQuerySchema.safeParse({ cursoId: CURSO_ID })
    expect(sinColab.success).toBe(false)
  })

  it("brechasDetectadasQuerySchema exige cursoId UUID", () => {
    const ok = brechasDetectadasQuerySchema.safeParse({ cursoId: CURSO_ID })
    expect(ok.success).toBe(true)
  })

  it("centroRevisionQuerySchema tipo=TODAS por defecto, cursoId opcional", () => {
    const ok = centroRevisionQuerySchema.safeParse({})
    expect(ok.success).toBe(true)
    if (ok.success) {
      expect(ok.data.tipo).toBe("TODAS")
    }
  })
})

describe("ReportesController — exigirFormatoJson", () => {
  let svc: ServiceMock
  let ctrl: ReportesController

  beforeEach(() => {
    svc = buildServiceMock()
    const exportStub = {
      aCsv: vi.fn(),
      aXlsx: vi.fn(),
      aPdf: vi.fn(),
    } as unknown as ExportService
    const consultasStub = { registrar: vi.fn() } as unknown as ConsultasLogService
    ctrl = new ReportesController(svc as unknown as ReportesService, exportStub, consultasStub)
  })

  it("delega avance-curso con query parseada por Zod", async () => {
    svc.obtenerAvanceCurso.mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    })
    await ctrl.obtenerAvanceCurso({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      page: 1,
      pageSize: 20,
      format: "json",
    })
    expect(svc.obtenerAvanceCurso).toHaveBeenCalledOnce()
  })

  it("rechaza format!=json con 422 formatoNoSoportadoEnP11b", () => {
    expect(() =>
      ctrl.obtenerAvanceCurso({
        cursoId: CURSO_ID,
        vista: "ACTUAL",
        page: 1,
        pageSize: 20,
        // El controller defiende ante un schema mas laxo. Se le pasa un valor
        // que el schema actual no permite — la garantia esta en este test:
        // si en el futuro el schema relaja, el cinturon en el controller
        // sigue cumpliendo.
        format: "csv" as unknown as "json",
      }),
    ).toThrow(UnprocessableEntityException)
  })

  it("delega detalle-colaborador, brechas, centro-revision al service", async () => {
    svc.obtenerDetalleColaborador.mockResolvedValueOnce({})
    svc.obtenerBrechasDetectadas.mockResolvedValueOnce({})
    svc.obtenerCentroRevision.mockResolvedValueOnce({})
    await ctrl.obtenerDetalleColaborador({
      cursoId: CURSO_ID,
      colaboradorId: COLAB_ID,
      vista: "ACTUAL",
      format: "json",
    })
    await ctrl.obtenerBrechasDetectadas({
      cursoId: CURSO_ID,
      vista: "ACTUAL",
      format: "json",
    })
    await ctrl.obtenerCentroRevision({
      tipo: "TODAS",
      vista: "ACTUAL",
      format: "json",
    })
    expect(svc.obtenerDetalleColaborador).toHaveBeenCalledOnce()
    expect(svc.obtenerBrechasDetectadas).toHaveBeenCalledOnce()
    expect(svc.obtenerCentroRevision).toHaveBeenCalledOnce()
  })
})
