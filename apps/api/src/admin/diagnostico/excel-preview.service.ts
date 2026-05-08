import { randomUUID } from "node:crypto"
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type { ExcelPreviewFila, ExcelPreviewResponse } from "@nexott-learn/shared-types"
import ExcelJS from "exceljs"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ExcelUploadCacheService } from "./excel-upload-cache.service"

// =============================================================================
// PREVIEW DE CARGA EXCEL
// PR 3b · valida tipo+tamano, parsea con exceljs, clasifica filas como
// ok/warning/error y guarda el resultado en cache 15 min para confirmar luego.
// =============================================================================

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const MAX_BYTES = 10 * 1024 * 1024
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PreviewInput {
  readonly cursoId: string
  readonly file: {
    readonly buffer: Buffer
    readonly mimetype: string
    readonly originalname: string
    readonly size: number
  } | null
}

@Injectable()
export class ExcelPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: ExcelUploadCacheService,
  ) {}

  async preview({ cursoId, file }: PreviewInput): Promise<ExcelPreviewResponse> {
    validarArchivo(file)

    // Curso debe existir.
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true },
    })
    if (!curso) {
      throw new NotFoundException("Curso no encontrado")
    }

    // Areas del curso, en el mismo orden que la plantilla.
    const cursoAreas = await this.prisma.cursoArea.findMany({
      where: { cursoId },
      orderBy: { orden: "asc" },
      select: { areaId: true, area: { select: { nombre: true } } },
    })

    // Inscripciones ACTIVAS del curso indexadas por email.
    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { cursoId, estado: "ACTIVA" },
      select: {
        participante: { select: { email: true } },
      },
    })
    const emailsConocidos = new Set(inscripciones.map((i) => i.participante.email.toLowerCase()))

    const ws = await cargarWorksheet(file.buffer)

    const filas: ExcelPreviewFila[] = []
    let okCount = 0
    let warnCount = 0
    let errCount = 0

    // Datos desde fila 4 (1=titulo, 2=instrucciones, 3=cabeceras).
    const lastRow = ws.actualRowCount
    for (let r = 4; r <= lastRow; r += 1) {
      const row = ws.getRow(r)
      const email = String(row.getCell(1).value ?? "").trim()
      const nombre = String(row.getCell(2).value ?? "").trim()

      if (!(email || nombre)) {
        continue // fila vacia
      }

      const fila = clasificarFila(row, email, nombre, cursoAreas, emailsConocidos)
      if (fila.estado === "ok") {
        okCount += 1
      } else if (fila.estado === "warning") {
        warnCount += 1
      } else {
        errCount += 1
      }
      filas.push(fila)
    }

    const uploadId = randomUUID()
    this.cache.set(uploadId, cursoId, filas)

    return {
      filas,
      resumen: { ok: okCount, warnings: warnCount, errores: errCount },
      uploadId,
    }
  }
}

type ArchivoExcel = NonNullable<PreviewInput["file"]>

function validarArchivo(file: PreviewInput["file"]): asserts file is ArchivoExcel {
  if (!file) {
    throw new BadRequestException("Archivo requerido en campo 'archivo'")
  }
  if (file.size > MAX_BYTES) {
    throw new BadRequestException("El archivo excede el tamano maximo de 10 MB")
  }
  if (file.mimetype !== MIME_XLSX) {
    throw new BadRequestException("Formato no soportado. Solo se acepta .xlsx (Excel 2007+).")
  }
}

async function cargarWorksheet(buffer: Buffer): Promise<ExcelJS.Worksheet> {
  let workbook: ExcelJS.Workbook
  try {
    workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer)
  } catch {
    throw new BadRequestException("Archivo Excel invalido o corrupto")
  }
  const ws = workbook.worksheets[0]
  if (!ws) {
    throw new BadRequestException("El archivo no contiene hojas")
  }
  return ws
}

interface CursoAreaInfo {
  readonly areaId: string
  readonly area: { readonly nombre: string }
}

interface NotasParseResult {
  readonly notas: ExcelPreviewFila["notas"]
  readonly mensajes: string[]
  readonly huboCapeo: boolean
  readonly huboFormato: boolean
}

function parsearNotas(row: ExcelJS.Row, cursoAreas: readonly CursoAreaInfo[]): NotasParseResult {
  const notas: Array<{ areaId: string; valor: number | null }> = []
  const mensajes: string[] = []
  let huboCapeo = false
  let huboFormato = false

  cursoAreas.forEach((ca, idx) => {
    const raw = row.getCell(3 + idx).value
    if (raw === null || raw === undefined || raw === "") {
      notas.push({ areaId: ca.areaId, valor: null })
      return
    }
    const num = parseNumeric(raw)
    if (num === null) {
      notas.push({ areaId: ca.areaId, valor: null })
      mensajes.push(`Nota no numerica en "${ca.area.nombre}", se omite`)
      huboFormato = true
      return
    }
    if (num < 0 || num > 100) {
      const cap = Math.max(0, Math.min(100, num))
      notas.push({ areaId: ca.areaId, valor: cap })
      mensajes.push(`Nota fuera de rango en "${ca.area.nombre}" (${num}), capeada a ${cap}`)
      huboCapeo = true
      return
    }
    notas.push({ areaId: ca.areaId, valor: num })
  })

  return { notas, mensajes, huboCapeo, huboFormato }
}

function clasificarFila(
  row: ExcelJS.Row,
  email: string,
  nombre: string,
  cursoAreas: readonly CursoAreaInfo[],
  emailsConocidos: ReadonlySet<string>,
): ExcelPreviewFila {
  const { notas, mensajes, huboCapeo, huboFormato } = parsearNotas(row, cursoAreas)

  let estado: ExcelPreviewFila["estado"]
  if (!(email && EMAIL_REGEX.test(email))) {
    estado = "error"
    mensajes.unshift("Email vacio o con formato invalido")
  } else if (!emailsConocidos.has(email.toLowerCase())) {
    estado = "error"
    mensajes.unshift("Email no pertenece a inscripcion activa de este curso")
  } else if (huboCapeo || huboFormato) {
    estado = "warning"
  } else {
    estado = "ok"
  }

  return { email, nombre, notas, estado, mensajes }
}

function parseNumeric(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim().replace(",", ".")
    if (!trimmed) {
      return null
    }
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
  }
  // Celdas formuladas: { formula, result }
  if (raw && typeof raw === "object" && "result" in raw) {
    return parseNumeric((raw as { result: unknown }).result)
  }
  return null
}
