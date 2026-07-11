import { beforeEach, describe, expect, it, vi } from "vitest"
import { AiService } from "../common/ai/ai.service"
import type { PrismaService } from "../common/prisma/prisma.service"
import type { RepoFetchService } from "../common/repo-fetch/repo-fetch.service"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import type { TransversalCapasService } from "./transversal-capas.service"

const INTENTO_ID_BASE = "10000000-0000-0000-0000-00000000000"
const REPO_URL = "https://github.com/foo/bar"
const CONTENIDO_REPO = "===== index.ts =====\nconst a = 1"

interface PrismaMock {
  readonly intentoTransversal: {
    readonly findUnique: ReturnType<typeof vi.fn>
    readonly findMany: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return {
    intentoTransversal: {
      findUnique: vi.fn().mockResolvedValue({
        repoUrl: REPO_URL,
        estado: "EN_EVALUACION",
        colaboradorId: "f0000000-0000-0000-0000-000000000001",
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  }
}

function buildAi(): AiService {
  return {
    providerName: "mock",
    evaluarRepoCualitativo: vi
      .fn()
      .mockResolvedValue({ nota: 80, comentario: "x", confianza: "alta" }),
    resolveModel: vi.fn(),
  } as unknown as AiService
}

function buildRepoFetchMock(): {
  readonly mock: RepoFetchService
  readonly descargarYEmpaquetar: ReturnType<typeof vi.fn>
} {
  const descargarYEmpaquetar = vi.fn().mockResolvedValue({
    contenido: CONTENIDO_REPO,
    archivosIncluidos: 1,
    bytesTotales: CONTENIDO_REPO.length,
    truncado: false,
  })
  return {
    mock: { descargarYEmpaquetar } as unknown as RepoFetchService,
    descargarYEmpaquetar,
  }
}

function buildCapasServiceMock(): {
  readonly mock: TransversalCapasService
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
    } as unknown as TransversalCapasService,
    cargarCapaTests,
    cargarCapaCualitativa,
    cargarCapaComprension,
  }
}

async function flushHasta(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
}

describe("JobEvaluacionTransversalService (una capa: revisión con IA)", () => {
  let prisma: PrismaMock
  let ai: AiService
  let capas: ReturnType<typeof buildCapasServiceMock>
  let repoFetch: ReturnType<typeof buildRepoFetchMock>
  let job: JobEvaluacionTransversalService

  beforeEach(() => {
    vi.useFakeTimers()
    prisma = buildPrismaMock()
    ai = buildAi()
    capas = buildCapasServiceMock()
    repoFetch = buildRepoFetchMock()
    job = new JobEvaluacionTransversalService(
      prisma as unknown as PrismaService,
      ai,
      capas.mock,
      repoFetch.mock,
    )
  })

  it("descarga el repo, evalúa con IA y carga SOLO la capa cualitativa", async () => {
    job.dispatch(`${INTENTO_ID_BASE}1`)
    await flushHasta(2100)

    // Descarga el repo entregado y le pasa el CONTENIDO (no la URL) a la IA.
    expect(repoFetch.descargarYEmpaquetar).toHaveBeenCalledWith(REPO_URL)
    expect(ai.evaluarRepoCualitativo).toHaveBeenCalledOnce()
    const inputIa = (ai.evaluarRepoCualitativo as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as { contenidoRepo: string }
    expect(inputIa.contenidoRepo).toBe(CONTENIDO_REPO)

    // Solo cualitativa: tests-fijo y comprensión ya no se corren.
    expect(capas.cargarCapaCualitativa).toHaveBeenCalledOnce()
    expect(capas.cargarCapaTests).not.toHaveBeenCalled()
    expect(capas.cargarCapaComprension).not.toHaveBeenCalled()

    const args = capas.cargarCapaCualitativa.mock.calls[0]?.[0] as {
      body: { nota: number; detalle: { confianza: string } }
      idempotencyKey: string
    }
    expect(args.body.nota).toBe(80)
    expect(args.body.detalle.confianza).toBe("ALTA")
    expect(args.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
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
    expect(capas.cargarCapaCualitativa).toHaveBeenCalledTimes(12)
  })

  it("onModuleInit reencola los intentos EN_EVALUACION con repo al arranque", async () => {
    prisma.intentoTransversal.findMany.mockResolvedValueOnce([
      { id: `${INTENTO_ID_BASE}5` },
      { id: `${INTENTO_ID_BASE}6` },
    ])

    await job.onModuleInit()

    // Consulta solo los colgados no anulados con repo, más viejos primero, con
    // take = tope + 1 (para distinguir "justo el tope" de "hay más").
    expect(prisma.intentoTransversal.findMany).toHaveBeenCalledWith({
      where: { estado: "EN_EVALUACION", anulado: false, repoUrl: { not: null } },
      select: { id: true },
      orderBy: { fecha: "asc" },
      take: 101,
    })
    expect(job.estadoCola.enCurso).toBe(2)

    await flushHasta(2100)
    expect(capas.cargarCapaCualitativa).toHaveBeenCalledTimes(2)
  })

  it("onModuleInit respeta el tope: reencola 100 aunque la BD devuelva 101", async () => {
    const cientoUno = Array.from({ length: 101 }, (_v, i) => ({
      id: `20000000-0000-0000-0000-${i.toString().padStart(12, "0")}`,
    }))
    prisma.intentoTransversal.findMany.mockResolvedValueOnce(cientoUno)

    await job.onModuleInit()

    // 100 en juego (10 en curso + 90 pendientes); el 101 queda para el próximo arranque.
    expect(job.estadoCola.enCurso + job.estadoCola.pendientes).toBe(100)
  })

  it("onModuleInit no hace nada si no hay intentos colgados", async () => {
    await job.onModuleInit()
    expect(job.estadoCola.enCurso).toBe(0)
    expect(job.estadoCola.pendientes).toBe(0)
  })

  it("onModuleInit no propaga si la consulta de BD falla", async () => {
    prisma.intentoTransversal.findMany.mockRejectedValueOnce(new Error("db caída"))
    await expect(job.onModuleInit()).resolves.toBeUndefined()
    expect(job.estadoCola.enCurso).toBe(0)
  })
})
