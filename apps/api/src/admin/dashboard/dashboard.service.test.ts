// P1 · tests del DashboardService.
//
// Estrategia: stub manual de PrismaService con solo los modelos que el
// service toca. Cubre los 4 KPIs, banner de cola, alertas (orden y umbrales)
// y mapeo de LogActividad → feed de actividad.

import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { DashboardService } from "./dashboard.service"
import { ALERTAS_LIMITE, RIESGO_DIAS_INACTIVIDAD } from "./dashboard.types"

type Stub = ReturnType<typeof vi.fn>

interface PrismaStubs {
  curso: { count: Stub }
  inscripcion: {
    groupBy: Stub
    count: Stub
    findMany: Stub
  }
  entregaBloque: { count: Stub }
  entregaProyecto: { count: Stub }
  alertaIA: { count: Stub }
  logActividad: { findMany: Stub }
}

function buildPrisma(): PrismaStubs {
  return {
    curso: { count: vi.fn().mockResolvedValue(0) },
    inscripcion: {
      groupBy: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    entregaBloque: { count: vi.fn().mockResolvedValue(0) },
    entregaProyecto: { count: vi.fn().mockResolvedValue(0) },
    alertaIA: { count: vi.fn().mockResolvedValue(0) },
    logActividad: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

function buildService(prisma: PrismaStubs = buildPrisma()) {
  const service = new DashboardService(prisma as unknown as PrismaService)
  return { service, prisma }
}

describe("DashboardService.obtenerDashboard · KPIs", () => {
  it("formatea numeros y arma los 4 KPIs canonicos", async () => {
    const { service, prisma } = buildService()
    prisma.curso.count.mockResolvedValue(8)
    // groupBy se llama dos veces con shapes distintos. Distinguimos por el
    // campo `by` que pasa el service (participanteId vs estado).
    prisma.inscripcion.groupBy.mockImplementation(({ by }: { by: readonly string[] }) => {
      if (by.includes("participanteId")) {
        return Promise.resolve(Array.from({ length: 47 }, (_, i) => ({ participanteId: `p-${i}` })))
      }
      return Promise.resolve([])
    })

    const out = await service.obtenerDashboard()

    expect(out.kpis).toHaveLength(4)
    const byId = new Map(out.kpis.map((k) => [k.id, k]))
    expect([...byId.keys()]).toEqual(["cursos", "participantes", "completitud", "riesgo"])
    expect(byId.get("cursos")?.value).toBe("8")
    expect(byId.get("cursos")?.tone).toBe("brand")
    expect(byId.get("participantes")?.value).toBe("47")
    expect(byId.get("riesgo")?.tone).toBe("neutral") // 0 en riesgo → neutral
  })

  it("calcula tasa de completitud sobre inscripciones cerradas (ignora ACTIVA)", async () => {
    const { service, prisma } = buildService()
    prisma.inscripcion.groupBy.mockImplementation(({ by }: { by: readonly string[] }) => {
      if (by.includes("estado")) {
        return Promise.resolve([
          { estado: "COMPLETADA", _count: { _all: 8 } },
          { estado: "ABANDONADA", _count: { _all: 2 } },
        ])
      }
      return Promise.resolve([])
    })

    const out = await service.obtenerDashboard()
    const kpiCompletitud = out.kpis.find((k) => k.id === "completitud")
    expect(kpiCompletitud?.value).toBe("80%")
    expect(kpiCompletitud?.helper).toBe("8 de 10")
    expect(kpiCompletitud?.tone).toBe("success")
  })

  it("tasa de completitud = 0% cuando no hay inscripciones cerradas", async () => {
    const { service } = buildService()
    const out = await service.obtenerDashboard()
    const kpi = out.kpis.find((k) => k.id === "completitud")
    expect(kpi?.value).toBe("0%")
    expect(kpi?.helper).toBe("sin inscripciones cerradas")
  })

  it("KPI de riesgo cuenta inactividad e ignora inscripciones recientes", async () => {
    const { service, prisma } = buildService()
    const ahora = Date.now()
    const inactivo = new Date(ahora - (RIESGO_DIAS_INACTIVIDAD + 1) * 24 * 60 * 60 * 1000)
    const reciente = new Date(ahora - 1 * 24 * 60 * 60 * 1000)

    prisma.inscripcion.findMany.mockResolvedValue([
      {
        id: "ins-1",
        inscritaAt: inactivo,
        curso: { deadline: null },
        entregasBloque: [{ enviadaAt: inactivo }],
      },
      {
        id: "ins-2",
        inscritaAt: reciente,
        curso: { deadline: null },
        entregasBloque: [{ enviadaAt: reciente }],
      },
    ])

    const out = await service.obtenerDashboard()
    const kpi = out.kpis.find((k) => k.id === "riesgo")
    expect(kpi?.value).toBe("1")
    expect(kpi?.tone).toBe("danger")
  })
})

describe("DashboardService · cola de revision", () => {
  it("emite items con counts y tono warning/danger cuando hay cola", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.count.mockResolvedValue(12)
    prisma.entregaProyecto.count.mockResolvedValue(3)
    prisma.alertaIA.count.mockResolvedValue(2)

    const out = await service.obtenerDashboard()
    expect(out.colaRevision?.items).toHaveLength(3)
    const map = new Map(out.colaRevision?.items.map((i) => [i.id, i]))
    expect(map.get("entregas")?.count).toBe(12)
    expect(map.get("entregas")?.tone).toBe("warning")
    expect(map.get("proyectos")?.count).toBe(3)
    expect(map.get("alertas")?.tone).toBe("danger")
    expect(out.colaRevision?.description).toMatch(/requiere tu evaluacion/)
  })

  it("muta a estado al-dia cuando la cola esta vacia", async () => {
    const { service } = buildService()
    const out = await service.obtenerDashboard()
    expect(out.colaRevision?.description).toMatch(/al dia/i)
    for (const item of out.colaRevision?.items ?? []) {
      expect(item.tone).toBe("neutral")
      expect(item.count).toBe(0)
    }
  })
})

describe("DashboardService · alertas", () => {
  it("emite alertas en orden de prioridad (IA → entregas → proyectos → riesgo → diagnostico)", async () => {
    const { service, prisma } = buildService()
    prisma.alertaIA.count.mockResolvedValue(1)
    prisma.entregaBloque.count.mockResolvedValue(3)
    prisma.entregaProyecto.count.mockResolvedValue(2)
    prisma.inscripcion.count.mockResolvedValue(4) // diagnosticos pendientes

    const out = await service.obtenerDashboard()
    expect(out.alertas.map((a) => a.id)).toEqual([
      "alert-ia",
      "alert-entregas",
      "alert-proyectos",
      "alert-diagnostico",
    ])
  })

  it("entregas >= 5 escala a Critica/danger", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.count.mockResolvedValue(5)
    const out = await service.obtenerDashboard()
    const alerta = out.alertas.find((a) => a.id === "alert-entregas")
    expect(alerta?.tag).toBe("Critica")
    expect(alerta?.tagTone).toBe("danger")
  })

  it("respeta el limite ALERTAS_LIMITE", async () => {
    const { service, prisma } = buildService()
    prisma.alertaIA.count.mockResolvedValue(1)
    prisma.entregaBloque.count.mockResolvedValue(1)
    prisma.entregaProyecto.count.mockResolvedValue(1)
    prisma.inscripcion.count.mockResolvedValue(1)
    // Forzar un en-riesgo extra para empujar a 5+
    prisma.inscripcion.findMany.mockResolvedValue([
      {
        id: "x",
        inscritaAt: new Date(0),
        curso: { deadline: null },
        entregasBloque: [],
      },
    ])

    const out = await service.obtenerDashboard()
    expect(out.alertas.length).toBeLessThanOrEqual(ALERTAS_LIMITE)
  })

  it("sin pendientes → array vacio (no emite ruido)", async () => {
    const { service } = buildService()
    const out = await service.obtenerDashboard()
    expect(out.alertas).toEqual([])
  })
})

describe("DashboardService · actividad desde LogActividad", () => {
  it("mapea CURSO_PUBLICADO y omite RECALCULO_*", async () => {
    const { service, prisma } = buildService()
    prisma.logActividad.findMany.mockResolvedValue([
      {
        id: "log-1",
        tipoAccion: "CURSO_PUBLICADO",
        tipoActor: "USUARIO",
        timestamp: new Date(Date.now() - 5 * 60_000),
        entidadTipo: "Curso",
        entidadId: "c-1",
        actor: { nombre: "Carlos", apellido: "F." },
        valorDespues: null,
      },
      {
        id: "log-2",
        tipoAccion: "RECALCULO_AREA", // ruido — debe omitirse
        tipoActor: "SISTEMA",
        timestamp: new Date(),
        entidadTipo: "Area",
        entidadId: "a-1",
        actor: null,
        valorDespues: null,
      },
    ])

    const out = await service.obtenerDashboard()
    expect(out.actividad).toHaveLength(1)
    const item = out.actividad[0]
    if (item == null) {
      throw new Error("expected item")
    }
    expect(item.id).toBe("log-log-1")
    expect(item.title).toBe("Curso publicado")
    expect(item.meta).toContain("Carlos F.")
    expect(item.meta).toContain("hace 5 min")
  })

  it("ENTREGA_EVALUADA extrae nota y tono del valorDespues", async () => {
    const { service, prisma } = buildService()
    prisma.logActividad.findMany.mockResolvedValue([
      {
        id: "log-1",
        tipoAccion: "ENTREGA_EVALUADA",
        tipoActor: "USUARIO",
        timestamp: new Date(),
        entidadTipo: "EntregaBloque",
        entidadId: "e-1",
        actor: { nombre: "Admin", apellido: "Tester" },
        valorDespues: { nota: 85 },
      },
      {
        id: "log-2",
        tipoAccion: "PROYECTO_EVALUADO",
        tipoActor: "USUARIO",
        timestamp: new Date(),
        entidadTipo: "EntregaProyecto",
        entidadId: "p-1",
        actor: { nombre: "Admin", apellido: "Tester" },
        valorDespues: { notaFinal: 42 },
      },
    ])

    const out = await service.obtenerDashboard()
    expect(out.actividad).toHaveLength(2)
    const [a, b] = out.actividad
    if (a == null || b == null) {
      throw new Error("expected 2 items")
    }
    expect(a.highlight).toBe("85/100")
    expect(a.highlightTone).toBe("success")
    expect(b.highlight).toBe("42/100")
    expect(b.highlightTone).toBe("danger")
  })

  it("actor SISTEMA se renderiza como 'Sistema'", async () => {
    const { service, prisma } = buildService()
    prisma.logActividad.findMany.mockResolvedValue([
      {
        id: "log-1",
        tipoAccion: "INSCRIPCION_COMPLETADA",
        tipoActor: "SISTEMA",
        timestamp: new Date(),
        entidadTipo: "Inscripcion",
        entidadId: "i-1",
        actor: null,
        valorDespues: null,
      },
    ])

    const out = await service.obtenerDashboard()
    const item = out.actividad[0]
    if (item == null) {
      throw new Error("expected item")
    }
    expect(item.meta.startsWith("Sistema")).toBe(true)
  })
})
