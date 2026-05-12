import { beforeEach, describe, expect, it, vi } from "vitest"
import { AiService } from "../common/ai/ai.service"
import type { PrismaService } from "../common/prisma/prisma.service"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import type { TransversalService } from "./transversal.service"

const INTENTO_ID_BASE = "10000000-0000-0000-0000-00000000000"
const REPO_URL = "https://github.com/foo/bar"

interface PrismaMock {
  readonly intentoTransversal: {
    readonly findUnique: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return {
    intentoTransversal: {
      findUnique: vi.fn().mockResolvedValue({
        repoUrl: REPO_URL,
        estado: "EN_EVALUACION",
        colaboradorId: "f0000000-0000-0000-0000-000000000001",
        transversal: { capaTestsActiva: true },
      }),
    },
  }
}

function buildAi(): AiService {
  return {
    providerName: "mock",
    evaluarRepoCualitativo: vi
      .fn()
      .mockResolvedValue({ nota: 80, comentario: "x", confianza: "alta" }),
    mantenerTurnoComprension: vi
      .fn()
      .mockImplementation(({ turnoIndex }: { turnoIndex: number }) =>
        Promise.resolve(
          turnoIndex >= 3
            ? { siguientePregunta: null, nota: 72, finalizado: true }
            : { siguientePregunta: "q", nota: null, finalizado: false },
        ),
      ),
    mantenerTurnoEntrevista: vi.fn(),
    resolveModel: vi.fn(),
  } as unknown as AiService
}

function buildTransversalServiceMock(): {
  readonly mock: TransversalService
  readonly cargarCapaTests: ReturnType<typeof vi.fn>
  readonly cargarCapaCualitativa: ReturnType<typeof vi.fn>
  readonly cargarCapaComprension: ReturnType<typeof vi.fn>
} {
  const cargarCapaTests = vi.fn().mockResolvedValue({})
  const cargarCapaCualitativa = vi.fn().mockResolvedValue({})
  const cargarCapaComprension = vi.fn().mockResolvedValue({})
  return {
    mock: {
      cargarCapaTests,
      cargarCapaCualitativa,
      cargarCapaComprension,
    } as unknown as TransversalService,
    cargarCapaTests,
    cargarCapaCualitativa,
    cargarCapaComprension,
  }
}

async function flushHasta(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
}

describe("JobEvaluacionTransversalService (P8a + P8b)", () => {
  let prisma: PrismaMock
  let ai: AiService
  let transversal: ReturnType<typeof buildTransversalServiceMock>
  let job: JobEvaluacionTransversalService

  beforeEach(() => {
    vi.useFakeTimers()
    prisma = buildPrismaMock()
    ai = buildAi()
    transversal = buildTransversalServiceMock()
    job = new JobEvaluacionTransversalService(
      prisma as unknown as PrismaService,
      ai,
      transversal.mock,
    )
  })

  it("dispatch invoca AiService y carga las 3 capas via transversalService", async () => {
    job.dispatch(`${INTENTO_ID_BASE}1`)
    await flushHasta(2100)
    expect(ai.evaluarRepoCualitativo).toHaveBeenCalledOnce()
    expect(transversal.cargarCapaTests).toHaveBeenCalledOnce()
    expect(transversal.cargarCapaCualitativa).toHaveBeenCalledOnce()
    const args = transversal.cargarCapaCualitativa.mock.calls[0]?.[0] as {
      body: { nota: number; detalle: { confianza: string } }
      idempotencyKey: string
    }
    expect(args.body.nota).toBe(80)
    expect(args.body.detalle.confianza).toBe("ALTA")
    expect(args.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(transversal.cargarCapaComprension).toHaveBeenCalledOnce()
  })

  it("dispatch del mismo intentoId varias veces solo procesa una vez", async () => {
    job.dispatch(`${INTENTO_ID_BASE}2`)
    job.dispatch(`${INTENTO_ID_BASE}2`)
    job.dispatch(`${INTENTO_ID_BASE}2`)
    await flushHasta(2100)
    expect(ai.evaluarRepoCualitativo).toHaveBeenCalledOnce()
  })

  it("cola saturada (>10) encola y procesa al liberar slots", async () => {
    for (let i = 0; i < 12; i += 1) {
      job.dispatch(`${INTENTO_ID_BASE}${i.toString().padStart(2, "0")}`)
    }
    expect(job.estadoCola.enCurso).toBe(10)
    expect(job.estadoCola.pendientes).toBe(2)
    await flushHasta(2100)
    await flushHasta(2100)
    expect(transversal.cargarCapaCualitativa).toHaveBeenCalledTimes(12)
  })
})
