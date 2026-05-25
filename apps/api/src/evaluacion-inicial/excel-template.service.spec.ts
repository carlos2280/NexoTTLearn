import { ConflictException, NotFoundException } from "@nestjs/common"
import { EstadoAsignado, EstadoCurso, RolAsignacion } from "@prisma/client"
import { Workbook } from "exceljs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { ExcelTemplateService } from "./excel-template.service"

const CURSO_ID = "curso-1"

interface PrismaMock {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { findMany: ReturnType<typeof vi.fn> }
}

function buildPrismaMock(): PrismaMock {
  return {
    curso: { findUnique: vi.fn() },
    asignacionCurso: { findMany: vi.fn() },
  }
}

function cursoOk() {
  return {
    id: CURSO_ID,
    titulo: "Backend Avanzado",
    estado: EstadoCurso.BORRADOR,
    areasExigidas: [
      { areaId: "area-1", area: { id: "area-1", nombre: "Backend" } },
      { areaId: "area-2", area: { id: "area-2", nombre: "Tooling" } },
    ],
    skillsExigidas: [
      {
        skillId: "skill-1",
        skill: { id: "skill-1", etiquetaVisible: "python.fastapi", areaId: "area-1" },
      },
      {
        skillId: "skill-2",
        skill: { id: "skill-2", etiquetaVisible: "git.rebase", areaId: "area-2" },
      },
    ],
  }
}

function asignaciones() {
  return [
    {
      colaboradorId: "col-1",
      colaborador: { id: "col-1", email: "alice@nttdata.test", nombre: "Alice" },
    },
    {
      colaboradorId: "col-2",
      colaborador: { id: "col-2", email: "bob@nttdata.test", nombre: "Bob" },
    },
  ]
}

describe("ExcelTemplateService.generarTemplate", () => {
  let prisma: PrismaMock
  let service: ExcelTemplateService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new ExcelTemplateService(prisma as unknown as PrismaService)
  })

  it("happy path: genera workbook con hoja Notas + Instrucciones y asignados", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignaciones())

    const resultado = await service.generarTemplate(CURSO_ID)

    expect(resultado.asignados).toBe(2)
    expect(resultado.skillsExigidas).toBe(2)
    expect(resultado.areasExigidas).toBe(2)

    const workbook = new Workbook()
    await workbook.xlsx.load(resultado.buffer)

    const hojaNotas = workbook.getWorksheet("Notas")
    expect(hojaNotas).toBeDefined()
    const headers = hojaNotas?.getRow(1).values
    // Row.values usa 1-based; el indice 0 es undefined.
    expect(Array.isArray(headers)).toBe(true)
    const headersArr = headers as (string | undefined)[]
    expect(headersArr[1]).toBe("email")
    expect(headersArr[2]).toBe("nombre")
    expect(headersArr[3]).toBe("[SKILL:skill-1|python.fastapi]")
    expect(headersArr[4]).toBe("[SKILL:skill-2|git.rebase]")
    expect(headersArr[5]).toBe("[AREA:area-1|Backend]")
    expect(headersArr[6]).toBe("[AREA:area-2|Tooling]")

    expect(hojaNotas?.rowCount).toBe(3) // header + 2 asignados
    const filaAlice = hojaNotas?.getRow(2).values as (string | undefined)[]
    expect(filaAlice[1]).toBe("alice@nttdata.test")
    expect(filaAlice[2]).toBe("Alice")

    const hojaInstrucciones = workbook.getWorksheet("Instrucciones")
    expect(hojaInstrucciones).toBeDefined()
    const titulo = hojaInstrucciones?.getRow(1).getCell(1).value
    expect(String(titulo)).toContain("Backend Avanzado")
  })

  it("curso inexistente: 404 cursoNoEncontrado", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    let caught: unknown
    try {
      await service.generarTemplate(CURSO_ID)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
    const resp = (caught as NotFoundException).getResponse() as { code?: string }
    expect(resp.code).toBe(apiErrorCodes.cursoNoEncontrado)
  })

  it("curso sin areas ni skills: 409 conflictCursoNoPublicable SIN_DECLARACION", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      ...cursoOk(),
      areasExigidas: [],
      skillsExigidas: [],
    })

    let caught: unknown
    try {
      await service.generarTemplate(CURSO_ID)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ConflictException)
    const resp = (caught as ConflictException).getResponse() as {
      code?: string
      details?: { motivo?: string }
    }
    expect(resp.code).toBe(apiErrorCodes.conflictCursoNoPublicable)
    expect(resp.details?.motivo).toBe("SIN_DECLARACION")
  })

  it("curso sin asignados activos: 409 conflictCursoNoPublicable", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue([])

    let caught: unknown
    try {
      await service.generarTemplate(CURSO_ID)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ConflictException)
    const resp = (caught as ConflictException).getResponse() as {
      code?: string
      details?: { motivo?: string }
    }
    expect(resp.code).toBe(apiErrorCodes.conflictCursoNoPublicable)
    expect(resp.details?.motivo).toBe("SIN_ASIGNADOS_ACTIVOS")
  })

  it("orden de columnas: skills primero, areas despues (D-EVI-6)", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignaciones())

    const resultado = await service.generarTemplate(CURSO_ID)
    const workbook = new Workbook()
    await workbook.xlsx.load(resultado.buffer)
    const headers = workbook.getWorksheet("Notas")?.getRow(1).values as (string | undefined)[]

    const idxSkill1 = headers.findIndex((h) => h?.startsWith("[SKILL:skill-1"))
    const idxArea1 = headers.findIndex((h) => h?.startsWith("[AREA:area-1"))
    expect(idxSkill1).toBeGreaterThan(0)
    expect(idxArea1).toBeGreaterThan(idxSkill1)
  })

  it("A03 Formula Injection: celdas con prefijo activo se escapan con comilla simple", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      ...cursoOk(),
      areasExigidas: [
        { areaId: "area-1", area: { id: "area-1", nombre: "=SUM(A1:A10)" } },
        { areaId: "area-2", area: { id: "area-2", nombre: "@cmd|calc" } },
      ],
      skillsExigidas: [
        {
          skillId: "skill-1",
          skill: { id: "skill-1", etiquetaVisible: "+evil", areaId: "area-1" },
        },
        {
          skillId: "skill-2",
          skill: { id: "skill-2", etiquetaVisible: "-formula", areaId: "area-2" },
        },
      ],
    })
    prisma.asignacionCurso.findMany.mockResolvedValue([
      {
        colaboradorId: "col-evil",
        colaborador: {
          id: "col-evil",
          email: '=HYPERLINK("http://evil","click")',
          nombre: "@SUM(A1:A10)",
        },
      },
    ])

    const resultado = await service.generarTemplate(CURSO_ID)
    const workbook = new Workbook()
    await workbook.xlsx.load(resultado.buffer)
    const hojaNotas = workbook.getWorksheet("Notas")
    const headers = hojaNotas?.getRow(1).values as (string | undefined)[]

    // Headers con prefijo activo dentro del contenido del corchete: el "["
    // inicial NO es activo, pero defensa en profundidad: comprobamos que el
    // identificador codificado se conserva intacto (no se rompe).
    expect(headers[3]).toContain("skill-1|+evil")
    expect(headers[5]).toContain("area-1|=SUM")

    // Fila de datos: email y nombre con prefijos activos van con "'" delante.
    const fila = hojaNotas?.getRow(2).values as (string | undefined)[]
    expect(fila[1]).toBe(`'=HYPERLINK("http://evil","click")`)
    expect(fila[2]).toBe("'@SUM(A1:A10)")
  })

  it("query findMany filtra ASIGNADO no RETIRADO", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignaciones())

    await service.generarTemplate(CURSO_ID)
    const llamada = prisma.asignacionCurso.findMany.mock.calls[0]?.[0] as {
      where?: { rol?: string; estadoAsignado?: { not?: string } }
    }
    expect(llamada.where?.rol).toBe(RolAsignacion.ASIGNADO)
    expect(llamada.where?.estadoAsignado).toEqual({ not: EstadoAsignado.RETIRADO })
  })
})
