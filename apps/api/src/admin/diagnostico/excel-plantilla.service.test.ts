import ExcelJS from "exceljs"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { ExcelPlantillaService } from "./excel-plantilla.service"

interface PrismaMock {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  cursoArea: { findMany: ReturnType<typeof vi.fn> }
  inscripcion: { findMany: ReturnType<typeof vi.fn> }
}

function buildPrisma(): PrismaMock {
  return {
    curso: { findUnique: vi.fn() },
    cursoArea: { findMany: vi.fn() },
    inscripcion: { findMany: vi.fn() },
  }
}

const CURSO_ID = "11111111-1111-1111-1111-111111111111"

describe("ExcelPlantillaService", () => {
  it("genera buffer con headers, areas en orden y filas pre-rellenadas", async () => {
    const prisma = buildPrisma()
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      titulo: "Fullstack",
      empresaCliente: "ACME",
    })
    prisma.cursoArea.findMany.mockResolvedValue([
      { id: "ca-1", orden: 0, area: { id: "a-1", nombre: "Frontend" } },
      { id: "ca-2", orden: 1, area: { id: "a-2", nombre: "Backend" } },
    ])
    prisma.inscripcion.findMany.mockResolvedValue([
      { participante: { email: "ana@ntt.com", nombre: "Ana" } },
      { participante: { email: "luis@ntt.com", nombre: "Luis" } },
    ])

    const service = new ExcelPlantillaService(prisma as unknown as PrismaService)
    const { buffer, filename } = await service.generar({ cursoId: CURSO_ID })

    expect(filename).toMatch(/^plantilla-eval-inicial-acme-\d{8}\.xlsx$/)
    expect(buffer.length).toBeGreaterThan(0)

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer as unknown as ArrayBuffer)
    const ws = wb.worksheets[0]
    expect(ws).toBeDefined()
    if (!ws) {
      return
    }

    expect(String(ws.getCell("A1").value)).toContain("Fullstack")
    expect(String(ws.getCell("A1").value)).toContain("ACME")

    expect(ws.getCell("A3").value).toBe("Email")
    expect(ws.getCell("B3").value).toBe("Nombre")
    expect(ws.getCell("C3").value).toBe("Frontend")
    expect(ws.getCell("D3").value).toBe("Backend")

    expect(ws.getCell("A4").value).toBe("ana@ntt.com")
    expect(ws.getCell("B4").value).toBe("Ana")
    expect(ws.getCell("A5").value).toBe("luis@ntt.com")
    expect(ws.getCell("B5").value).toBe("Luis")
  })

  it("respeta el orden de CursoArea.orden (no alfabetico)", async () => {
    const prisma = buildPrisma()
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      titulo: "X",
      empresaCliente: "Y",
    })
    prisma.cursoArea.findMany.mockResolvedValue([
      { id: "ca-z", orden: 0, area: { id: "a-z", nombre: "Z-area" } },
      { id: "ca-a", orden: 1, area: { id: "a-a", nombre: "A-area" } },
    ])
    prisma.inscripcion.findMany.mockResolvedValue([])

    const service = new ExcelPlantillaService(prisma as unknown as PrismaService)
    const { buffer } = await service.generar({ cursoId: CURSO_ID })

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer as unknown as ArrayBuffer)
    const ws = wb.worksheets[0]
    if (!ws) {
      throw new Error("worksheet")
    }
    expect(ws.getCell("C3").value).toBe("Z-area")
    expect(ws.getCell("D3").value).toBe("A-area")
  })

  it("genera plantilla aun sin candidatos invitados", async () => {
    const prisma = buildPrisma()
    prisma.curso.findUnique.mockResolvedValue({
      id: CURSO_ID,
      titulo: "T",
      empresaCliente: "E",
    })
    prisma.cursoArea.findMany.mockResolvedValue([
      { id: "ca-1", orden: 0, area: { id: "a-1", nombre: "Front" } },
    ])
    prisma.inscripcion.findMany.mockResolvedValue([])

    const service = new ExcelPlantillaService(prisma as unknown as PrismaService)
    const { buffer, filename } = await service.generar({ cursoId: CURSO_ID })

    expect(buffer.length).toBeGreaterThan(0)
    expect(filename).toContain("plantilla-eval-inicial-e-")
  })

  it("404 si el curso no existe", async () => {
    const prisma = buildPrisma()
    prisma.curso.findUnique.mockResolvedValue(null)
    const service = new ExcelPlantillaService(prisma as unknown as PrismaService)
    await expect(service.generar({ cursoId: CURSO_ID })).rejects.toThrow(/no encontrado/i)
  })
})
