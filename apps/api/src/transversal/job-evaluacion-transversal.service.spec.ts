import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AiService } from "../common/ai/ai.service"
import type { PrismaService } from "../common/prisma/prisma.service"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"

const INTENTO_ID_BASE = "10000000-0000-0000-0000-00000000000"
const REPO_URL = "https://github.com/foo/bar"

interface PrismaMock {
  readonly intentoTransversal: {
    readonly findUnique: ReturnType<typeof vi.fn>
    readonly update: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return {
    intentoTransversal: {
      findUnique: vi.fn().mockResolvedValue({ repoUrl: REPO_URL, estado: "EN_EVALUACION" }),
      update: vi.fn().mockResolvedValue({}),
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

async function flushHasta(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
}

describe("JobEvaluacionTransversalService (P8a)", () => {
  let prisma: PrismaMock
  let ai: AiService
  let job: JobEvaluacionTransversalService

  beforeEach(() => {
    vi.useFakeTimers()
    prisma = buildPrismaMock()
    ai = buildAi()
    job = new JobEvaluacionTransversalService(prisma as unknown as PrismaService, ai)
  })

  it("dispatch persiste las 3 notas y pasa a EVALUADO", async () => {
    job.dispatch(`${INTENTO_ID_BASE}1`)
    await flushHasta(2100)
    expect(ai.evaluarRepoCualitativo).toHaveBeenCalledOnce()
    expect(prisma.intentoTransversal.update).toHaveBeenCalledOnce()
    const args = prisma.intentoTransversal.update.mock.calls[0]?.[0] as {
      data: {
        notaCapaTests: Prisma.Decimal
        notaCapaCualitativa: Prisma.Decimal
        notaCapaComprension: Prisma.Decimal | null
        estado: string
      }
    }
    expect(args.data.estado).toBe("EVALUADO")
    expect(args.data.notaCapaCualitativa.toString()).toBe("80")
    expect(args.data.notaCapaComprension?.toString()).toBe("72")
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
    // Tras la primera tanda los 10 slots liberan y los 2 pendientes se procesan.
    await flushHasta(2100)
    expect(prisma.intentoTransversal.update).toHaveBeenCalledTimes(12)
  })
})
