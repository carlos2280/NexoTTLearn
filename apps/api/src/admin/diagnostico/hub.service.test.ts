import { describe, expect, it } from "vitest"
import { HOY, buildCursoRow, buildHubService } from "./hub.test-helpers"

describe("HubDiagnosticoService.obtenerHub", () => {
  it("retorna lista vacia si no hay cursos ACTIVO", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([])
    const r = await service.obtenerHub(HOY)
    expect(r).toEqual({ items: [], total: 0 })
  })

  it("marca sin-invitados cuando el curso no tiene inscripciones ACTIVA", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([buildCursoRow({ id: "c1", inscripciones: [] })])
    const r = await service.obtenerHub(HOY)
    expect(r.items).toHaveLength(1)
    expect(r.items[0]).toMatchObject({
      cursoId: "c1",
      estadoDiagnostico: "sin-invitados",
      tabSugerido: 1,
      contadores: { invitados: 0, sinEvaluacion: 0, sinAsignacion: 0 },
    })
  })

  it("marca pendiente y tabSugerido=2 cuando faltan evaluaciones", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([
      buildCursoRow({
        id: "c1",
        inscripciones: [
          { id: "i1", tieneEvaluacion: false, tieneAsignacion: false },
          { id: "i2", tieneEvaluacion: true, tieneAsignacion: false },
        ],
      }),
    ])
    const r = await service.obtenerHub(HOY)
    expect(r.items[0]).toMatchObject({
      estadoDiagnostico: "pendiente",
      tabSugerido: 2,
      contadores: { invitados: 2, sinEvaluacion: 1, sinAsignacion: 2 },
    })
  })

  it("marca pendiente y tabSugerido=3 cuando todas tienen evaluacion pero falta asignar", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([
      buildCursoRow({
        id: "c1",
        inscripciones: [
          { id: "i1", tieneEvaluacion: true, tieneAsignacion: false },
          { id: "i2", tieneEvaluacion: true, tieneAsignacion: true },
        ],
      }),
    ])
    const r = await service.obtenerHub(HOY)
    expect(r.items[0]).toMatchObject({
      estadoDiagnostico: "pendiente",
      tabSugerido: 3,
      contadores: { invitados: 2, sinEvaluacion: 0, sinAsignacion: 1 },
    })
  })

  it("marca al-dia cuando todas las inscripciones tienen evaluacion y asignacion", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([
      buildCursoRow({
        id: "c1",
        inscripciones: [
          { id: "i1", tieneEvaluacion: true, tieneAsignacion: true },
          { id: "i2", tieneEvaluacion: true, tieneAsignacion: true },
        ],
      }),
    ])
    const r = await service.obtenerHub(HOY)
    expect(r.items[0]).toMatchObject({
      estadoDiagnostico: "al-dia",
      tabSugerido: 3,
      contadores: { invitados: 2, sinEvaluacion: 0, sinAsignacion: 0 },
    })
  })

  it("calcula diasRestantes desde hoy hasta deadline", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([
      buildCursoRow({
        id: "c1",
        deadline: new Date("2026-05-14T00:00:00Z"),
        inscripciones: [{ id: "i1", tieneEvaluacion: false, tieneAsignacion: false }],
      }),
    ])
    const r = await service.obtenerHub(HOY)
    const item = r.items[0]
    expect(item).toBeDefined()
    expect(item?.diasRestantes).toBe(7)
    expect(item?.deadline).toBe("2026-05-14T00:00:00.000Z")
  })

  it("ordena por urgencia: deadline<14d pendiente, pendiente, al-dia, sin-invitados", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([
      buildCursoRow({
        id: "alDia",
        titulo: "AlDia",
        inscripciones: [{ id: "x", tieneEvaluacion: true, tieneAsignacion: true }],
      }),
      buildCursoRow({ id: "sinInv", titulo: "SinInv", inscripciones: [] }),
      buildCursoRow({
        id: "pendUrg",
        titulo: "PendUrg",
        deadline: new Date("2026-05-10T00:00:00Z"),
        inscripciones: [{ id: "y", tieneEvaluacion: false, tieneAsignacion: false }],
      }),
      buildCursoRow({
        id: "pendNorm",
        titulo: "PendNorm",
        deadline: null,
        inscripciones: [{ id: "z", tieneEvaluacion: false, tieneAsignacion: false }],
      }),
    ])
    const r = await service.obtenerHub(HOY)
    expect(r.items.map((item) => item.cursoId)).toEqual(["pendUrg", "pendNorm", "alDia", "sinInv"])
  })

  it("desempata pendientes por diasRestantes asc, null al final, luego titulo", async () => {
    const { service, prisma } = buildHubService()
    prisma.curso.findMany.mockResolvedValue([
      buildCursoRow({
        id: "p20",
        titulo: "P20",
        deadline: new Date("2026-05-27T00:00:00Z"),
        inscripciones: [{ id: "a", tieneEvaluacion: false, tieneAsignacion: false }],
      }),
      buildCursoRow({
        id: "pNull",
        titulo: "PNull",
        deadline: null,
        inscripciones: [{ id: "b", tieneEvaluacion: false, tieneAsignacion: false }],
      }),
      buildCursoRow({
        id: "p30",
        titulo: "P30",
        deadline: new Date("2026-06-06T00:00:00Z"),
        inscripciones: [{ id: "c", tieneEvaluacion: false, tieneAsignacion: false }],
      }),
    ])
    const r = await service.obtenerHub(HOY)
    expect(r.items.map((item) => item.cursoId)).toEqual(["p20", "p30", "pNull"])
  })
})
