import { Injectable, Logger } from "@nestjs/common"
import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import type { ColumnaDef, ExportResult, FormatoColumna } from "./export.types"

const MIME_CSV = "text/csv; charset=utf-8"
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const MIME_PDF = "application/pdf"

/**
 * `ExportService` — D-S11-C6 / D-S11-C7.
 *
 * Helper transversal para transformar datos JSON canonicos a CSV / XLSX / PDF.
 * Buffer en memoria (no streaming) — apropiado para volumen admin esperado.
 * El controller setea `Content-Disposition: attachment; filename=...` a partir
 * de la `extension` que devuelve cada metodo.
 *
 * Convenciones de formato (`ColumnaDef.formato`):
 *   - `texto`     (default): `String(value ?? "")`.
 *   - `numero`             : `Number(value).toLocaleString("es-ES")`.
 *   - `porcentaje`         : `${value}%` con 0 decimales.
 *   - `fecha`              : ISO 8601 simplificado (yyyy-mm-dd HH:mm) en UTC.
 *
 * El PDF se genera con `pdfkit` (MVP visual minimo: titulo + tabla con bordes
 * simples). Si el cliente pide diseno rico, evaluar puppeteer en S13 (D-S11-C6).
 */
@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name)

  async aCsv<T>(rows: readonly T[], columnas: readonly ColumnaDef<T>[]): Promise<ExportResult> {
    const lineas: string[] = []
    lineas.push(columnas.map((c) => escaparCsv(c.header)).join(","))
    for (const row of rows) {
      const valores = columnas.map((col) => {
        const raw = (row as Record<string, unknown>)[col.key]
        return escaparCsv(formatearValor(raw, col.formato))
      })
      lineas.push(valores.join(","))
    }
    const buffer = Buffer.from(`${lineas.join("\n")}\n`, "utf-8")
    return { buffer, mime: MIME_CSV, extension: "csv" }
  }

  async aXlsx<T>(
    rows: readonly T[],
    columnas: readonly ColumnaDef<T>[],
    hoja: string,
  ): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook()
    workbook.created = new Date()
    const sheet = workbook.addWorksheet(hoja.slice(0, 31) || "Reporte")
    sheet.columns = columnas.map((col) => ({
      header: col.header,
      key: col.key,
      width: Math.max(col.header.length + 2, 14),
    }))
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    for (const row of rows) {
      const valores: Record<string, string> = {}
      for (const col of columnas) {
        const raw = (row as Record<string, unknown>)[col.key]
        valores[col.key] = formatearValor(raw, col.formato)
      }
      sheet.addRow(valores)
    }
    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer)
    return { buffer, mime: MIME_XLSX, extension: "xlsx" }
  }

  async aPdf<T>(
    titulo: string,
    columnas: readonly ColumnaDef<T>[],
    rows: readonly T[],
  ): Promise<ExportResult> {
    return new Promise<ExportResult>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 36, size: "A4" })
        const chunks: Buffer[] = []
        doc.on("data", (chunk: Buffer) => chunks.push(chunk))
        doc.on("error", (err: Error) => reject(err))
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks)
          resolve({ buffer, mime: MIME_PDF, extension: "pdf" })
        })

        doc.fontSize(16).text(titulo, { align: "center" })
        doc.moveDown()

        doc.fontSize(10)
        const headers = columnas.map((c) => c.header).join(" | ")
        doc.font("Helvetica-Bold").text(headers)
        doc.font("Helvetica")
        doc.moveDown(0.5)

        for (const row of rows) {
          const fila = columnas
            .map((col) => formatearValor((row as Record<string, unknown>)[col.key], col.formato))
            .join(" | ")
          doc.text(fila)
        }

        doc.end()
      } catch (err) {
        this.logger.error(`PDF generation failed: ${err instanceof Error ? err.message : err}`)
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }
}

function escaparCsv(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatearValor(value: unknown, formato: FormatoColumna | undefined): string {
  if (value === null || value === undefined) {
    return ""
  }
  switch (formato) {
    case "numero":
      return typeof value === "number" ? value.toLocaleString("es-ES") : String(value)
    case "porcentaje":
      return `${typeof value === "number" ? Math.round(value) : String(value)}%`
    case "fecha": {
      if (value instanceof Date) {
        return value.toISOString().slice(0, 16).replace("T", " ")
      }
      if (typeof value === "string") {
        return value.slice(0, 16).replace("T", " ")
      }
      return String(value)
    }
    default:
      return typeof value === "string" ? value : String(value)
  }
}
