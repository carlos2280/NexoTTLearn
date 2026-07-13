import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AiService } from "../common/ai/ai.service"
import type { PrismaService } from "../common/prisma/prisma.service"
import type { RepoFetchService } from "../common/repo-fetch/repo-fetch.service"
import { JobEvaluacionTransversalService } from "./job-evaluacion-transversal.service"
import type { TransversalCapasService } from "./transversal-capas.service"

const INTENTO_ID_BASE = "10000000-0000-0000-0000-00000000000"
const REPO_URL = "https://github.com/foo/bar"
const CONTENIDO_REPO = "===== index.ts =====\nconst a = 1"
// `Usuario.id` real del participante dueño del intento (distinto de `Colaborador.id`).
const USUARIO_ID = "c0000000-0000-0000-0000-000000000009"

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
        colaborador: { usuario: { id: USUARIO_ID } },
        transversal: {
          umbralAprobacion: new Prisma.Decimal(70),
          skills: [
            { skill: { etiquetaVisible: "TypeScript" } },
            { skill: { etiquetaVisible: "Testing" } },
          ],
        },
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  }
}

/** Informe rico que devuelve el motor IA (shape `EvaluarRepoCualitativoOutput`). */
function informeRico(nota: number | null): {
  nota: number | null
  confianza: "alta"
  resumen: string
  queReviso: string
  queNoReviso: string
  porDimension: { dimension: string; nota: number | null; comentario: string }[]
  fortalezas: string[]
  aReforzar: { que: string; sugerencia: string }[]
} {
  return {
    nota,
    confianza: "alta",
    resumen: "Buen trabajo.",
    queReviso: "estructura, tests",
    queNoReviso: "no ejecuto el codigo",
    porDimension: [
      { dimension: "TypeScript", nota, comentario: "solido" },
      { dimension: "Testing", nota, comentario: "aceptable" },
    ],
    fortalezas: ["estructura clara"],
    aReforzar: [{ que: "tests", sugerencia: "casos borde" }],
  }
}

function buildAi(): AiService {
  return {
    providerName: "mock",
    evaluarRepoCualitativo: vi.fn().mockResolvedValue(informeRico(80)),
    resolveModel: vi.fn(),
  } as unknown as AiService
}

function buildRepoFetchMock(): {
  readonly mock: RepoFetchService
  readonly descargarYEmpaquetar: ReturnType<typeof vi.fn>
} {
  const descargarYEmpaquetar = vi.fn().mockResolvedValue({
    contenido: CONTENIDO_REPO,
    archivos: ["index.js"],
    archivosIncluidos: 1,
    bytesTotales: CONTENIDO_REPO.length,
    truncado: false,
    commit: "abc1234",
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
      .calls[0]?.[0] as { contenidoRepo: string; dimensiones: string[] }
    expect(inputIa.contenidoRepo).toBe(CONTENIDO_REPO)
    // Los ejes = skills del transversal se pasan al motor.
    expect(inputIa.dimensiones).toEqual(["TypeScript", "Testing"])

    // Solo cualitativa: tests-fijo y comprensión ya no se corren.
    expect(capas.cargarCapaCualitativa).toHaveBeenCalledOnce()
    expect(capas.cargarCapaTests).not.toHaveBeenCalled()
    expect(capas.cargarCapaComprension).not.toHaveBeenCalled()

    const args = capas.cargarCapaCualitativa.mock.calls[0]?.[0] as {
      body: {
        nota: number
        detalle: {
          confianza: string
          veredicto: string
          resumen: string
          porDimension: { dimension: string }[]
        }
      }
      idempotencyKey: string
      usuario: { usuarioId: string }
    }
    expect(args.body.nota).toBe(80)
    expect(args.body.detalle.confianza).toBe("ALTA")
    // Veredicto derivado por el job (nota 80 >= umbral 70).
    expect(args.body.detalle.veredicto).toBe("apto")
    expect(args.body.detalle.resumen).toBe("Buen trabajo.")
    expect(args.body.detalle.porDimension.map((d) => d.dimension)).toEqual([
      "TypeScript",
      "Testing",
    ])
    expect(args.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    // Regresión FK idempotencia: la capa se persiste con el Usuario.id real del
    // colaborador, NO con el Colaborador.id (que no existe en `usuarios`).
    expect(args.usuario.usuarioId).toBe(USUARIO_ID)
  })

  it("deriva veredicto 'necesita_ajustes' cuando la nota queda bajo el umbral", async () => {
    ;(ai.evaluarRepoCualitativo as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      informeRico(60),
    )
    job.dispatch(`${INTENTO_ID_BASE}5`)
    await flushHasta(2100)

    const args = capas.cargarCapaCualitativa.mock.calls[0]?.[0] as {
      body: { nota: number; detalle: { veredicto: string } }
    }
    expect(args.body.nota).toBe(60)
    expect(args.body.detalle.veredicto).toBe("necesita_ajustes")
  })

  it("no carga la capa si la IA no pudo puntuar el repo (nota null)", async () => {
    ;(ai.evaluarRepoCualitativo as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      informeRico(null),
    )
    job.dispatch(`${INTENTO_ID_BASE}6`)
    await flushHasta(2100)

    expect(ai.evaluarRepoCualitativo).toHaveBeenCalledOnce()
    expect(capas.cargarCapaCualitativa).not.toHaveBeenCalled()
  })

  it("omite el job si el colaborador del intento no tiene usuario asociado", async () => {
    prisma.intentoTransversal.findUnique.mockResolvedValueOnce({
      repoUrl: REPO_URL,
      estado: "EN_EVALUACION",
      colaborador: { usuario: null },
    })

    job.dispatch(`${INTENTO_ID_BASE}3`)
    await flushHasta(2100)

    expect(repoFetch.descargarYEmpaquetar).not.toHaveBeenCalled()
    expect(capas.cargarCapaCualitativa).not.toHaveBeenCalled()
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
