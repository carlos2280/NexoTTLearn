import { Injectable, NotFoundException } from "@nestjs/common"
import ExcelJS from "exceljs"
import { PrismaService } from "../../common/prisma/prisma.service"
import { slugify } from "../cursos/cursos.slug"

// =============================================================================
// PLANTILLA EXCEL DE EVALUACION INICIAL
// PR 3b · genera xlsx con candidatos pre-rellenados (tipo=SOLICITUD,
// estado=ACTIVA) y una columna por area del curso.
// MAESTRO §7.2 · puntaje Int 0-100 por (inscripcion, area).
// =============================================================================

interface PlantillaInput {
  readonly cursoId: string
}

export interface PlantillaResult {
  readonly buffer: Buffer
  readonly filename: string
}

@Injectable()
export class ExcelPlantillaService {
  constructor(private readonly prisma: PrismaService) {}

  async generar({ cursoId }: PlantillaInput): Promise<PlantillaResult> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, titulo: true, empresaCliente: true },
    })
    if (!curso) {
      throw new NotFoundException("Curso no encontrado")
    }

    const areas = await this.prisma.cursoArea.findMany({
      where: { cursoId },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        orden: true,
        area: { select: { id: true, nombre: true } },
      },
    })

    const inscripciones = await this.prisma.inscripcion.findMany({
      where: { cursoId, tipo: "SOLICITUD", estado: "ACTIVA" },
      orderBy: { inscritaAt: "asc" },
      select: {
        participante: {
          select: { email: true, nombre: true },
        },
      },
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = "NexoTT Learn"
    wb.created = new Date()
    const ws = wb.addWorksheet("Evaluacion inicial")

    const totalCols = 2 + areas.length
    const lastColLetter = ws.getColumn(totalCols).letter

    // Fila 1 · titulo
    ws.mergeCells(`A1:${lastColLetter}1`)
    const c1 = ws.getCell("A1")
    c1.value = `Plantilla de Evaluacion Inicial · ${curso.titulo} · ${curso.empresaCliente}`
    c1.font = { bold: true, size: 12 }
    c1.alignment = { vertical: "middle", horizontal: "left" }

    // Fila 2 · instrucciones
    ws.mergeCells(`A2:${lastColLetter}2`)
    const c2 = ws.getCell("A2")
    c2.value =
      "Rango 0-100 por area. Vacio = no evaluado. No modifiques las cabeceras de la fila 3."
    c2.font = { italic: true, size: 10 }
    c2.alignment = { vertical: "middle", horizontal: "left", wrapText: true }

    // Fila 3 · cabeceras
    const headers = ["Email", "Nombre", ...areas.map((a) => a.area.nombre)]
    const headerRow = ws.getRow(3)
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1)
      cell.value = h
      cell.font = { bold: true }
      cell.alignment = { vertical: "middle", horizontal: i < 2 ? "left" : "center" }
    })
    headerRow.commit()

    // Filas de datos · pre-rellenadas
    inscripciones.forEach((insc, idx) => {
      const row = ws.getRow(4 + idx)
      row.getCell(1).value = insc.participante.email
      row.getCell(2).value = insc.participante.nombre
      // Notas en blanco (admin completa).
      row.commit()
    })

    // Anchos minimos.
    ws.getColumn(1).width = 32
    ws.getColumn(2).width = 28
    for (let i = 3; i <= totalCols; i += 1) {
      ws.getColumn(i).width = Math.max(12, Math.min(24, headers[i - 1]?.length ?? 12))
    }

    const arrayBuffer = await wb.xlsx.writeBuffer()
    const buffer = Buffer.from(arrayBuffer as ArrayBuffer)

    const fecha = formatYYYYMMDD(new Date())
    const slugCliente = slugify(curso.empresaCliente) || slugify(curso.titulo) || cursoId
    const filename = `plantilla-eval-inicial-${slugCliente}-${fecha}.xlsx`

    return { buffer, filename }
  }
}

function formatYYYYMMDD(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}${m}${d}`
}
