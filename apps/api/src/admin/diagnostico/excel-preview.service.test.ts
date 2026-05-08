import ExcelJS from "exceljs"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { ExcelPreviewService } from "./excel-preview.service"
import { ExcelUploadCacheService } from "./excel-upload-cache.service"

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
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

interface FilaInput {
  readonly email: string
  readonly nombre: string
  readonly notas: ReadonlyArray<number | null | string>
}

async function buildXlsx(filas: readonly FilaInput[], areaCount = 2): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Eval")
  ws.getCell("A1").value = "Plantilla"
  ws.getCell("A2").value = "Instrucciones"
  ws.getCell("A3").value = "Email"
  ws.getCell("B3").value = "Nombre"
  for (let i = 0; i < areaCount; i += 1) {
    ws.getCell(3, 3 + i).value = `Area ${i + 1}`
  }
  filas.forEach((f, idx) => {
    const row = ws.getRow(4 + idx)
    row.getCell(1).value = f.email
    row.getCell(2).value = f.nombre
    f.notas.forEach((n, i) => {
      row.getCell(3 + i).value = n
    })
  })
  const ab = await wb.xlsx.writeBuffer()
  return Buffer.from(ab as ArrayBuffer)
}

function buildCursoMock(prisma: PrismaMock, emailsActivos: readonly string[]) {
  prisma.curso.findUnique.mockResolvedValue({ id: CURSO_ID })
  prisma.cursoArea.findMany.mockResolvedValue([
    { areaId: "a-1", area: { nombre: "Front" } },
    { areaId: "a-2", area: { nombre: "Back" } },
  ])
  prisma.inscripcion.findMany.mockResolvedValue(
    emailsActivos.map((email) => ({ participante: { email } })),
  )
}

function buildService() {
  const prisma = buildPrisma()
  const cache = new ExcelUploadCacheService()
  const service = new ExcelPreviewService(prisma as unknown as PrismaService, cache)
  return { service, prisma, cache }
}

describe("ExcelPreviewService", () => {
  it("clasifica filas ok / warning / error", async () => {
    const { service, prisma } = buildService()
    buildCursoMock(prisma, ["ana@ntt.com", "luis@ntt.com"])
    const buffer = await buildXlsx([
      { email: "ana@ntt.com", nombre: "Ana", notas: [80, 70] },
      { email: "luis@ntt.com", nombre: "Luis", notas: [120, "abc"] },
      { email: "desconocido@ntt.com", nombre: "Otro", notas: [50, 50] },
    ])

    const r = await service.preview({
      cursoId: CURSO_ID,
      file: { buffer, mimetype: MIME_XLSX, originalname: "x.xlsx", size: buffer.length },
    })

    expect(r.resumen).toEqual({ ok: 1, warnings: 1, errores: 1 })
    expect(r.filas[0]?.estado).toBe("ok")
    expect(r.filas[0]?.notas).toEqual([
      { areaId: "a-1", valor: 80 },
      { areaId: "a-2", valor: 70 },
    ])
    expect(r.filas[1]?.estado).toBe("warning")
    expect(r.filas[1]?.notas[0]?.valor).toBe(100) // capeado
    expect(r.filas[1]?.notas[1]?.valor).toBeNull() // no numerico omitido
    expect(r.filas[2]?.estado).toBe("error")
    expect(r.uploadId).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("rechaza archivo > 10MB sin parsear", async () => {
    const { service } = buildService()
    await expect(
      service.preview({
        cursoId: CURSO_ID,
        file: {
          buffer: Buffer.alloc(0),
          mimetype: MIME_XLSX,
          originalname: "x.xlsx",
          size: 11 * 1024 * 1024,
        },
      }),
    ).rejects.toThrow(/10 MB/i)
  })

  it("rechaza mimetype incorrecto", async () => {
    const { service } = buildService()
    await expect(
      service.preview({
        cursoId: CURSO_ID,
        file: {
          buffer: Buffer.from("hola"),
          mimetype: "text/plain",
          originalname: "x.txt",
          size: 4,
        },
      }),
    ).rejects.toThrow(/\.xlsx/i)
  })

  it("rechaza archivo malformado con 400", async () => {
    const { service, prisma } = buildService()
    buildCursoMock(prisma, ["ana@ntt.com"])
    const buffer = Buffer.from("contenido que no es zip")
    await expect(
      service.preview({
        cursoId: CURSO_ID,
        file: { buffer, mimetype: MIME_XLSX, originalname: "x.xlsx", size: buffer.length },
      }),
    ).rejects.toThrow(/invalido|corrupto/i)
  })

  it("guarda el preview en cache asociado al cursoId", async () => {
    const { service, cache, prisma } = buildService()
    buildCursoMock(prisma, ["ana@ntt.com"])
    const buffer = await buildXlsx([{ email: "ana@ntt.com", nombre: "Ana", notas: [80, 70] }])
    const r = await service.preview({
      cursoId: CURSO_ID,
      file: { buffer, mimetype: MIME_XLSX, originalname: "x.xlsx", size: buffer.length },
    })
    const entry = cache.get(r.uploadId, CURSO_ID)
    expect(entry).not.toBeNull()
    expect(entry?.filas).toHaveLength(1)
    cache.onModuleDestroy()
  })

  it("ignora filas completamente vacias", async () => {
    const { service, prisma } = buildService()
    buildCursoMock(prisma, ["ana@ntt.com"])
    const buffer = await buildXlsx([
      { email: "ana@ntt.com", nombre: "Ana", notas: [50, 50] },
      { email: "", nombre: "", notas: [] },
    ])
    const r = await service.preview({
      cursoId: CURSO_ID,
      file: { buffer, mimetype: MIME_XLSX, originalname: "x.xlsx", size: buffer.length },
    })
    expect(r.filas).toHaveLength(1)
  })

  it("404 si curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValue(null)
    prisma.cursoArea.findMany.mockResolvedValue([])
    prisma.inscripcion.findMany.mockResolvedValue([])
    const buffer = await buildXlsx([{ email: "x@y.com", nombre: "X", notas: [] }])
    await expect(
      service.preview({
        cursoId: CURSO_ID,
        file: { buffer, mimetype: MIME_XLSX, originalname: "x.xlsx", size: buffer.length },
      }),
    ).rejects.toThrow(/no encontrado/i)
  })
})
