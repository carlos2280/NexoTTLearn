import type { FichaPorAreaItem, FichaResponse, FichaSkillItem } from "@nexott-learn/shared-types"
import PDFDocument from "pdfkit"
import type { ColumnaDef } from "../common/export/export.types"

/**
 * Helpers de aplanado de la ficha para `GET /me/ficha/exportar` (FIX-pre-S12,
 * D90 §20.3). El controller delega al `ExportService` global con estas filas
 * y columnas; aqui solo se calcula la proyeccion plana.
 *
 * Exclusiones intencionales (D-PRIV-1):
 *   - Transcripciones completas de entrevistas IA.
 *   - Notas detalladas de capas transversales.
 *   - Solo se incluye la nota global y origen agregados por skill.
 */

export interface FilaFichaSkill {
  readonly area: string
  readonly skill: string
  readonly notaActual: string
  readonly origen: string
}

export interface FilaFichaPorArea {
  readonly area: string
  readonly promedio: string
  readonly skillsConNota: number
  readonly skillsTotales: number
}

export const COLUMNAS_FICHA_SKILLS: readonly ColumnaDef<FilaFichaSkill>[] = [
  { key: "area", header: "Area" },
  { key: "skill", header: "Skill" },
  { key: "notaActual", header: "Nota actual" },
  { key: "origen", header: "Origen" },
]

export const COLUMNAS_FICHA_POR_AREA: readonly ColumnaDef<FilaFichaPorArea>[] = [
  { key: "area", header: "Area" },
  { key: "promedio", header: "Promedio" },
  { key: "skillsConNota", header: "Skills con nota", formato: "numero" },
  { key: "skillsTotales", header: "Skills totales", formato: "numero" },
]

function formatearNota(nota: number | null): string {
  return nota === null ? "" : nota.toFixed(2)
}

function formatearOrigen(origen: Record<string, unknown> | null): string {
  if (origen === null) {
    return ""
  }
  const tipo = origen.tipo
  return typeof tipo === "string" ? tipo : ""
}

export function aplanarFichaSkills(ficha: FichaResponse): FilaFichaSkill[] {
  return ficha.skills.map((s: FichaSkillItem) => ({
    area: s.areaNombre,
    skill: s.etiquetaVisible,
    notaActual: formatearNota(s.notaActual),
    origen: formatearOrigen(s.origenActual),
  }))
}

export function aplanarFichaPorArea(ficha: FichaResponse): FilaFichaPorArea[] {
  return ficha.porArea.map((a: FichaPorAreaItem) => ({
    area: a.nombre,
    promedio: formatearNota(a.promedio),
    skillsConNota: a.skillsConNota,
    skillsTotales: a.skillsTotales,
  }))
}

/**
 * Combina ambos bloques en una sola string CSV con encabezado y separador. El
 * orden replica la lectura natural: resumen por area → detalle por skill.
 */
export function fichaACsv(ficha: FichaResponse): string {
  const lineas: string[] = []
  lineas.push(`# Ficha de skills — colaborador ${ficha.colaboradorId}`)
  lineas.push("")
  lineas.push("## Resumen por area")
  lineas.push(COLUMNAS_FICHA_POR_AREA.map((c) => escaparCsv(c.header)).join(","))
  for (const fila of aplanarFichaPorArea(ficha)) {
    lineas.push(COLUMNAS_FICHA_POR_AREA.map((c) => escaparCsv(String(fila[c.key] ?? ""))).join(","))
  }
  lineas.push("")
  lineas.push("## Detalle por skill")
  lineas.push(COLUMNAS_FICHA_SKILLS.map((c) => escaparCsv(c.header)).join(","))
  for (const fila of aplanarFichaSkills(ficha)) {
    lineas.push(COLUMNAS_FICHA_SKILLS.map((c) => escaparCsv(String(fila[c.key] ?? ""))).join(","))
  }
  return `${lineas.join("\n")}\n`
}

function escaparCsv(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Renderiza la ficha como PDF con `pdfkit` (consistente con `ExportService`):
 * titulo + tabla "Resumen por area" + tabla "Detalle por skill". Sin estilos
 * ricos — MVP visual sobrio, mismo criterio que D-S11-C6.
 */
export function fichaAPdf(ficha: FichaResponse): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 36, size: "A4" })
      const chunks: Buffer[] = []
      doc.on("data", (chunk: Buffer) => chunks.push(chunk))
      doc.on("error", (err: Error) => reject(err))
      doc.on("end", () => resolve(Buffer.concat(chunks)))

      doc.fontSize(16).text(`Ficha de skills — ${ficha.colaboradorId}`, { align: "center" })
      doc.moveDown()

      doc.fontSize(12).font("Helvetica-Bold").text("Resumen por area")
      doc.font("Helvetica").fontSize(10)
      doc.text(COLUMNAS_FICHA_POR_AREA.map((c) => c.header).join(" | "))
      doc.moveDown(0.3)
      for (const fila of aplanarFichaPorArea(ficha)) {
        doc.text(COLUMNAS_FICHA_POR_AREA.map((c) => String(fila[c.key] ?? "")).join(" | "))
      }

      doc.moveDown()
      doc.fontSize(12).font("Helvetica-Bold").text("Detalle por skill")
      doc.font("Helvetica").fontSize(10)
      doc.text(COLUMNAS_FICHA_SKILLS.map((c) => c.header).join(" | "))
      doc.moveDown(0.3)
      for (const fila of aplanarFichaSkills(ficha)) {
        doc.text(COLUMNAS_FICHA_SKILLS.map((c) => String(fila[c.key] ?? "")).join(" | "))
      }

      doc.end()
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}
