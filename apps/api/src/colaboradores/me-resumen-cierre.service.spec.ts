import { ConflictException, NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { MeResumenCierreService } from "./me-resumen-cierre.service"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { findUnique: ReturnType<typeof vi.fn> }
  cursoFotografiaCierre: { findUnique: ReturnType<typeof vi.fn> }
  skill: { findMany: ReturnType<typeof vi.fn> }
  historicoNotaSkill: { findMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    usuario: { findUnique: vi.fn() },
    asignacionCurso: { findUnique: vi.fn() },
    cursoFotografiaCierre: { findUnique: vi.fn() },
    skill: { findMany: vi.fn().mockResolvedValue([]) },
    historicoNotaSkill: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

const COLAB = "11111111-1111-1111-1111-111111111111"
const CURSO = "22222222-2222-2222-2222-222222222222"
const USER = "33333333-3333-3333-3333-333333333333"
const ASIG = "44444444-4444-4444-4444-444444444444"
const FECHA_INICIO = new Date("2026-04-01T00:00:00.000Z")
const FECHA_CIERRE = new Date("2026-05-15T18:00:00.000Z")

interface BuildSnapshotInput {
  readonly resultadoFinal: "APTO" | "NO_APTO" | "COMPLETADO" | "RETIRADO" | null
  readonly notaGlobalFinal?: number
  readonly skills: readonly { readonly skillId: string }[]
  readonly notasPorSkill: readonly {
    readonly skillId: string
    readonly notaActual: number | null
    readonly umbralCumple: number
  }[]
}

function buildSnapshot(input: BuildSnapshotInput) {
  return {
    versionSnapshot: 1,
    curso: {
      titulo: "Java Senior",
      configuracion: {
        skillsExigidas: input.skills,
      },
    },
    asignaciones: [
      {
        asignacionId: ASIG,
        resultadoFinal: input.resultadoFinal,
        ...(input.notaGlobalFinal !== undefined ? { notaGlobalFinal: input.notaGlobalFinal } : {}),
        notasPorSkill: input.notasPorSkill,
      },
    ],
  }
}

const AREA_BACK = { id: "area-back", codigo: "backend", nombre: "Backend" }
const AREA_QA = { id: "area-qa", codigo: "qa", nombre: "Testing" }

describe("MeResumenCierreService.obtenerResumenCierre", () => {
  let prisma: PrismaMock
  let service: MeResumenCierreService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new MeResumenCierreService(prisma as unknown as PrismaService)
  })

  it("404 asignacionNoEncontrada si no hay asignacion", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerResumenCierre(COLAB, CURSO)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("409 conflictCursoNoCerrado si el curso no esta cerrado", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: null,
      curso: { id: CURSO, estado: "ACTIVO", fechaInicio: FECHA_INICIO },
    })
    await expect(service.obtenerResumenCierre(COLAB, CURSO)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })

  it("409 si no hay fotografia de cierre", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: null,
      curso: { id: CURSO, estado: "CERRADO", fechaInicio: FECHA_INICIO },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerResumenCierre(COLAB, CURSO)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })

  it("409 si la fotografia esta descartada", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: null,
      curso: { id: CURSO, estado: "CERRADO", fechaInicio: FECHA_INICIO },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: true,
      fechaCierre: FECHA_CIERRE,
      snapshot: buildSnapshot({
        resultadoFinal: "APTO",
        skills: [{ skillId: "s1" }],
        notasPorSkill: [{ skillId: "s1", notaActual: 90, umbralCumple: 70 }],
      }),
    })
    await expect(service.obtenerResumenCierre(COLAB, CURSO)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })

  it("409 si el resultado final es RETIRADO (no es un veredicto visible)", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: null,
      curso: { id: CURSO, estado: "CERRADO", fechaInicio: FECHA_INICIO },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      fechaCierre: FECHA_CIERRE,
      snapshot: buildSnapshot({
        resultadoFinal: "RETIRADO",
        skills: [{ skillId: "s1" }],
        notasPorSkill: [{ skillId: "s1", notaActual: 90, umbralCumple: 70 }],
      }),
    })
    await expect(service.obtenerResumenCierre(COLAB, CURSO)).rejects.toBeInstanceOf(
      ConflictException,
    )
  })

  it("APTO: incluye cosecha (skill nueva), areasPorTrabajar vacio", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: "Buen trabajo",
      curso: { id: CURSO, estado: "CERRADO", fechaInicio: FECHA_INICIO },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      fechaCierre: FECHA_CIERRE,
      snapshot: buildSnapshot({
        resultadoFinal: "APTO",
        notaGlobalFinal: 88,
        skills: [{ skillId: "s-new" }, { skillId: "s-old" }],
        notasPorSkill: [
          { skillId: "s-new", notaActual: 90, umbralCumple: 70 },
          { skillId: "s-old", notaActual: 80, umbralCumple: 70 },
        ],
      }),
    })
    prisma.skill.findMany.mockResolvedValueOnce([
      { id: "s-new", etiquetaVisible: "React Hooks", area: AREA_BACK },
      { id: "s-old", etiquetaVisible: "Diseno OO", area: AREA_BACK },
    ])
    // s-old ya estaba demostrada antes (75 >= 70); s-new no tenia nota previa.
    prisma.historicoNotaSkill.findMany.mockResolvedValueOnce([
      { valor: 75, fecha: new Date("2026-03-01"), notaSkill: { skillId: "s-old" } },
    ])

    const response = await service.obtenerResumenCierre(COLAB, CURSO)

    expect(response.cursoId).toBe(CURSO)
    expect(response.cursoTitulo).toBe("Java Senior")
    expect(response.fechaCierre).toBe(FECHA_CIERRE.toISOString())
    expect(response.resultado).toBe("APTO")
    expect(response.notaGlobalFinal).toBe(88)
    expect(response.etiquetaCualitativaFinal).toBe("excelencia")
    expect(response.skillsDemostradasNuevas).toEqual([
      {
        skillId: "s-new",
        skillNombre: "React Hooks",
        areaCodigo: "backend",
        areaNombre: "Backend",
      },
    ])
    expect(response.areasPorTrabajar).toEqual([])
    expect(response.comentarioAdmin).toBe("Buen trabajo")
  })

  it("NO_APTO: incluye areasPorTrabajar con nivel inicial/enDesarrollo", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: null,
      curso: { id: CURSO, estado: "CERRADO", fechaInicio: FECHA_INICIO },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      fechaCierre: FECHA_CIERRE,
      snapshot: buildSnapshot({
        resultadoFinal: "NO_APTO",
        notaGlobalFinal: 62,
        skills: [{ skillId: "s-b1" }, { skillId: "s-b2" }, { skillId: "s-q1" }],
        notasPorSkill: [
          // Backend: 1 de 2 demostradas -> enDesarrollo.
          { skillId: "s-b1", notaActual: 80, umbralCumple: 70 },
          { skillId: "s-b2", notaActual: 30, umbralCumple: 70 },
          // QA: 0 de 1 -> inicial.
          { skillId: "s-q1", notaActual: null, umbralCumple: 60 },
        ],
      }),
    })
    prisma.skill.findMany.mockResolvedValueOnce([
      { id: "s-b1", etiquetaVisible: "Django REST", area: AREA_BACK },
      { id: "s-b2", etiquetaVisible: "ORM Avanzado", area: AREA_BACK },
      { id: "s-q1", etiquetaVisible: "Pytest", area: AREA_QA },
    ])

    const response = await service.obtenerResumenCierre(COLAB, CURSO)

    expect(response.resultado).toBe("NO_APTO")
    expect(response.etiquetaCualitativaFinal).toBe("enDesarrollo")
    expect(response.notaGlobalFinal).toBe(62)
    expect(response.areasPorTrabajar).toEqual([
      {
        areaId: AREA_BACK.id,
        areaCodigo: "backend",
        areaNombre: "Backend",
        nivelCualitativo: "enDesarrollo",
      },
      {
        areaId: AREA_QA.id,
        areaCodigo: "qa",
        areaNombre: "Testing",
        nivelCualitativo: "inicial",
      },
    ])
    // s-b1 demostrada y sin histórico previo -> cosecha.
    expect(response.skillsDemostradasNuevas).toEqual([
      {
        skillId: "s-b1",
        skillNombre: "Django REST",
        areaCodigo: "backend",
        areaNombre: "Backend",
      },
    ])
  })

  it("fallback de notaGlobalFinal: promedio de notas obligatorias cuando el snapshot no la trae", async () => {
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: null,
      curso: { id: CURSO, estado: "CERRADO", fechaInicio: FECHA_INICIO },
    })
    prisma.cursoFotografiaCierre.findUnique.mockResolvedValueOnce({
      descartada: false,
      fechaCierre: FECHA_CIERRE,
      snapshot: buildSnapshot({
        resultadoFinal: "APTO",
        // sin notaGlobalFinal en el snapshot
        skills: [{ skillId: "s1" }, { skillId: "s2" }],
        notasPorSkill: [
          { skillId: "s1", notaActual: 70, umbralCumple: 70 },
          { skillId: "s2", notaActual: 90, umbralCumple: 70 },
        ],
      }),
    })
    prisma.skill.findMany.mockResolvedValueOnce([])

    const response = await service.obtenerResumenCierre(COLAB, CURSO)

    expect(response.notaGlobalFinal).toBe(80) // (70 + 90) / 2
    expect(response.etiquetaCualitativaFinal).toBe("solido")
  })
})

describe("MeResumenCierreService.obtenerResumenCierreDeUsuario", () => {
  let prisma: PrismaMock
  let service: MeResumenCierreService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new MeResumenCierreService(prisma as unknown as PrismaService)
  })

  it("404 si el usuario no tiene colaborador", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(service.obtenerResumenCierreDeUsuario(USER, CURSO)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("resuelve colaboradorId desde el usuario", async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({ colaboradorId: COLAB })
    prisma.asignacionCurso.findUnique.mockResolvedValueOnce({
      id: ASIG,
      observacionesAdmin: null,
      curso: { id: CURSO, estado: "ACTIVO", fechaInicio: FECHA_INICIO },
    })

    await expect(service.obtenerResumenCierreDeUsuario(USER, CURSO)).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(prisma.asignacionCurso.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          // biome-ignore lint/style/useNamingConvention: clave compuesta Prisma.
          colaboradorId_cursoId: { colaboradorId: COLAB, cursoId: CURSO },
        }),
      }),
    )
  })
})
