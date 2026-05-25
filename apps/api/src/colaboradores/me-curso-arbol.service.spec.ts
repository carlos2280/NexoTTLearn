import { NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { MeCursoArbolService } from "./me-curso-arbol.service"

interface PrismaMock {
  usuario: { findUnique: ReturnType<typeof vi.fn> }
  curso: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { findFirst: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    usuario: { findUnique: vi.fn() },
    curso: { findUnique: vi.fn() },
    asignacionCurso: { findFirst: vi.fn() },
  }
}

const USUARIO_ID = "11111111-1111-1111-1111-111111111111"
const COLAB_ID = "22222222-2222-2222-2222-222222222222"
const CURSO_ID = "33333333-3333-3333-3333-333333333333"
const ASIG_ID = "44444444-4444-4444-4444-444444444444"

function cursoRow(overrides?: {
  estado?: "BORRADOR" | "ACTIVO" | "CERRADO" | "ARCHIVADO"
  toggleVoluntarios?: boolean
  modulos?: ReadonlyArray<{
    id: string
    titulo: string
    orden?: number
    secciones: ReadonlyArray<{ id: string; titulo: string; orden: number; bloques: number }>
  }>
  areasExigidas?: ReadonlyArray<{ peso: number; codigo: string; nombre: string; id: string }>
  skillsExigidas?: ReadonlyArray<{
    notaMinima: number
    skillId: string
    etiqueta: string
    areaCodigo: string
  }>
}) {
  return {
    id: CURSO_ID,
    titulo: "Curso Demo",
    estado: overrides?.estado ?? "ACTIVO",
    toggleVoluntarios: overrides?.toggleVoluntarios ?? true,
    fechaInicio: new Date("2026-06-01T00:00:00Z"),
    fechaDeadline: new Date("2026-08-01T00:00:00Z"),
    cliente: { id: "cli-1", nombre: "Cliente Demo" },
    areasExigidas: (overrides?.areasExigidas ?? []).map((a) => ({
      peso: new Prisma.Decimal(a.peso),
      area: { id: a.id, nombre: a.nombre, codigo: a.codigo },
    })),
    skillsExigidas: (overrides?.skillsExigidas ?? []).map((s) => ({
      notaMinima: new Prisma.Decimal(s.notaMinima),
      skill: {
        id: s.skillId,
        etiquetaVisible: s.etiqueta,
        area: { codigo: s.areaCodigo },
      },
    })),
    modulosHabilitados: (overrides?.modulos ?? []).map((m, indice) => ({
      orden: m.orden ?? indice,
      modulo: {
        id: m.id,
        titulo: m.titulo,
        secciones: m.secciones.map((s) => ({
          id: s.id,
          titulo: s.titulo,
          orden: s.orden,
          _count: { bloques: s.bloques },
        })),
      },
    })),
  }
}

describe("MeCursoArbolService.obtenerArbol", () => {
  let prisma: PrismaMock
  let service: MeCursoArbolService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new MeCursoArbolService(prisma as unknown as PrismaService)
    prisma.usuario.findUnique.mockResolvedValue({ colaboradorId: COLAB_ID })
  })

  it("modo asignado: usuario con asignacion ASIGNADO al curso", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow())
    prisma.asignacionCurso.findFirst.mockResolvedValue({ id: ASIG_ID, rol: "ASIGNADO" })

    const res = await service.obtenerArbol(USUARIO_ID, CURSO_ID)

    expect(res.modo).toBe("asignado")
    expect(res.asignacionId).toBe(ASIG_ID)
  })

  it("modo voluntario: usuario con asignacion VOLUNTARIO al curso", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow())
    prisma.asignacionCurso.findFirst.mockResolvedValue({ id: ASIG_ID, rol: "VOLUNTARIO" })

    const res = await service.obtenerArbol(USUARIO_ID, CURSO_ID)

    expect(res.modo).toBe("voluntario")
    expect(res.asignacionId).toBe(ASIG_ID)
  })

  it("modo preview: sin asignacion + curso ACTIVO + toggleVoluntarios=true", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow())
    prisma.asignacionCurso.findFirst.mockResolvedValue(null)

    const res = await service.obtenerArbol(USUARIO_ID, CURSO_ID)

    expect(res.modo).toBe("preview")
    expect(res.asignacionId).toBeNull()
  })

  it("404 si no hay asignacion y el curso no esta ACTIVO", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow({ estado: "BORRADOR" }))
    prisma.asignacionCurso.findFirst.mockResolvedValue(null)

    await expect(service.obtenerArbol(USUARIO_ID, CURSO_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("404 si no hay asignacion y toggleVoluntarios=false", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow({ toggleVoluntarios: false }))
    prisma.asignacionCurso.findFirst.mockResolvedValue(null)

    await expect(service.obtenerArbol(USUARIO_ID, CURSO_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("404 si el curso no existe", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)

    await expect(service.obtenerArbol(USUARIO_ID, CURSO_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("404 si el usuario no tiene colaborador", async () => {
    prisma.usuario.findUnique.mockResolvedValue(null)

    await expect(service.obtenerArbol(USUARIO_ID, CURSO_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it("proyecta modulos ordenados por CursoModuloHabilitado.orden (no por titulo)", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      cursoRow({
        modulos: [
          // Forzamos orden explicito: el modulo "Z" va primero porque tiene
          // orden=0; el modulo "A" va segundo con orden=1. Demuestra que el
          // sort YA NO depende del titulo (antes era localeCompare).
          {
            id: "m-z",
            titulo: "Z Modulo",
            orden: 0,
            secciones: [{ id: "s0", titulo: "S0", orden: 0, bloques: 2 }],
          },
          {
            id: "m-a",
            titulo: "A Modulo",
            orden: 1,
            secciones: [
              { id: "s2", titulo: "S2", orden: 1, bloques: 3 },
              { id: "s1", titulo: "S1", orden: 0, bloques: 5 },
            ],
          },
        ],
      }),
    )
    prisma.asignacionCurso.findFirst.mockResolvedValue({ id: ASIG_ID, rol: "ASIGNADO" })

    const res = await service.obtenerArbol(USUARIO_ID, CURSO_ID)

    expect(res.modulos.map((m) => m.titulo)).toEqual(["Z Modulo", "A Modulo"])
    expect(res.modulos[0]?.orden).toBe(0)
    expect(res.modulos[1]?.orden).toBe(1)
    // Las secciones del modulo "A Modulo" vienen del findMany con orderBy del
    // schema, asi que el mock las recibe en el orden que las definimos. El
    // service no debe re-ordenarlas.
    expect(res.modulos[1]?.secciones[0]?.seccionId).toBe("s2")
  })

  it("calcula areaPrincipal y skillsDestacadas top-4 ordenadas por peso/nota", async () => {
    prisma.curso.findUnique.mockResolvedValue(
      cursoRow({
        areasExigidas: [
          { peso: 30, codigo: "qa", nombre: "QA", id: "a-q" },
          { peso: 60, codigo: "backend", nombre: "Backend", id: "a-be" },
        ],
        skillsExigidas: [
          { notaMinima: 70, skillId: "s1", etiqueta: "Python", areaCodigo: "backend" },
          { notaMinima: 80, skillId: "s2", etiqueta: "Django", areaCodigo: "backend" },
          { notaMinima: 60, skillId: "s3", etiqueta: "Pytest", areaCodigo: "qa" },
          { notaMinima: 50, skillId: "s4", etiqueta: "Docker", areaCodigo: "devops" },
          { notaMinima: 40, skillId: "s5", etiqueta: "React", areaCodigo: "frontend" },
        ],
      }),
    )
    prisma.asignacionCurso.findFirst.mockResolvedValue({ id: ASIG_ID, rol: "ASIGNADO" })

    const res = await service.obtenerArbol(USUARIO_ID, CURSO_ID)

    expect(res.curso.areaPrincipal?.codigo).toBe("backend")
    expect(res.curso.skillsDestacadas.map((s) => s.etiquetaVisible)).toEqual([
      "Django",
      "Python",
      "Pytest",
      "Docker",
    ])
  })

  it("areaPrincipal=null cuando el curso no tiene areas exigidas", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoRow({ areasExigidas: [] }))
    prisma.asignacionCurso.findFirst.mockResolvedValue({ id: ASIG_ID, rol: "ASIGNADO" })

    const res = await service.obtenerArbol(USUARIO_ID, CURSO_ID)

    expect(res.curso.areaPrincipal).toBeNull()
  })
})
