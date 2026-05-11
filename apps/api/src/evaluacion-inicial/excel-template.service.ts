import { ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { EstadoAsignado, Prisma, RolAsignacion } from "@prisma/client"
import { Workbook } from "exceljs"
import type { Workbook as WorkbookType } from "exceljs"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import {
  AreaExigidaCursoTemplate,
  AsignadoTemplateRow,
  ExcelTemplateResult,
  SkillExigidaCursoTemplate,
} from "./evaluacion-inicial.types"

const SELECT_CURSO_TEMPLATE_FIELDS = {
  id: true,
  titulo: true,
  estado: true,
  areasExigidas: {
    select: {
      areaId: true,
      area: { select: { id: true, nombre: true } },
    },
  },
  skillsExigidas: {
    select: {
      skillId: true,
      skill: { select: { id: true, etiquetaVisible: true, areaId: true } },
    },
  },
} as const satisfies Prisma.CursoSelect

const SELECT_ASIGNACION_TEMPLATE_FIELDS = {
  colaboradorId: true,
  colaborador: { select: { id: true, email: true, nombre: true } },
} as const satisfies Prisma.AsignacionCursoSelect

const COLUMN_WIDTH_EMAIL = 32
const COLUMN_WIDTH_NOMBRE = 28
const COLUMN_WIDTH_NOTA = 28

/**
 * ExcelTemplateService — genera el template Excel para evaluacion inicial
 * (P5a, D7, D-EVI-6).
 *
 * El template tiene dos hojas:
 *   - `Notas`: filas precargadas con asignados (ASIGNADO activos) y columnas
 *     con headers codificados `[SKILL:<id>|<etiqueta>]` o `[AREA:<id>|<nombre>]`
 *     para que el parser inverso (P5b) reconstruya el mapeo sin ambiguedad.
 *     Orden: primero skills exigidas, luego areas exigidas (D-EVI-6).
 *   - `Instrucciones`: escala 0-100, regla "lo especifico gana", celda vacia
 *     se interpreta como null (sin evidencia).
 */
@Injectable()
export class ExcelTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async generarTemplate(cursoId: string): Promise<ExcelTemplateResult> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: SELECT_CURSO_TEMPLATE_FIELDS,
    })
    if (!curso) {
      throw new NotFoundException({
        code: apiErrorCodes.cursoNoEncontrado,
        message: `Curso ${cursoId} no encontrado.`,
      })
    }
    if (curso.areasExigidas.length === 0 && curso.skillsExigidas.length === 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoPublicable,
        message: "El curso no tiene areas exigidas ni skills exigidas declaradas.",
        details: { motivo: "SIN_DECLARACION" },
      })
    }

    const asignaciones = await this.prisma.asignacionCurso.findMany({
      where: {
        cursoId,
        rol: RolAsignacion.ASIGNADO,
        estadoAsignado: { not: EstadoAsignado.RETIRADO },
      },
      select: SELECT_ASIGNACION_TEMPLATE_FIELDS,
      orderBy: { colaborador: { email: "asc" } },
    })

    if (asignaciones.length === 0) {
      throw new ConflictException({
        code: apiErrorCodes.conflictCursoNoPublicable,
        message: "El curso no tiene colaboradores asignados activos.",
        details: { motivo: "SIN_ASIGNADOS_ACTIVOS" },
      })
    }

    const asignados: readonly AsignadoTemplateRow[] = asignaciones.map((a) => ({
      colaboradorId: a.colaborador.id,
      email: a.colaborador.email,
      nombre: a.colaborador.nombre,
    }))
    const skills: readonly SkillExigidaCursoTemplate[] = curso.skillsExigidas.map((se) => ({
      skillId: se.skill.id,
      etiquetaVisible: se.skill.etiquetaVisible,
      areaId: se.skill.areaId,
    }))
    const areas: readonly AreaExigidaCursoTemplate[] = curso.areasExigidas.map((ae) => ({
      areaId: ae.area.id,
      nombre: ae.area.nombre,
    }))

    const buffer = await this.buildWorkbook(curso.titulo, asignados, skills, areas)

    return {
      buffer,
      asignados: asignados.length,
      skillsExigidas: skills.length,
      areasExigidas: areas.length,
    }
  }

  private async buildWorkbook(
    tituloCurso: string,
    asignados: readonly AsignadoTemplateRow[],
    skills: readonly SkillExigidaCursoTemplate[],
    areas: readonly AreaExigidaCursoTemplate[],
  ): Promise<Buffer> {
    const workbook = new Workbook()
    workbook.creator = "NexoTT Learn"
    workbook.created = new Date()

    this.buildHojaInstrucciones(workbook, tituloCurso)
    this.buildHojaNotas(workbook, asignados, skills, areas)

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(arrayBuffer as ArrayBuffer)
  }

  private buildHojaInstrucciones(workbook: WorkbookType, tituloCurso: string): void {
    const hoja = workbook.addWorksheet("Instrucciones")
    const lineas: readonly string[] = [
      `Template de evaluacion inicial — curso "${tituloCurso}"`,
      "",
      "Escala: 0-100. Numeros enteros o decimales.",
      "Celda vacia = sin evidencia (null). null no equivale a 0.",
      "",
      "Reglas:",
      "  - Lo especifico gana: una nota por SKILL tiene prioridad sobre la nota",
      "    heredada del AREA a la que pertenece esa skill.",
      "  - Si solo se completa la columna del AREA, todas las skills de esa area",
      "    que sean exigidas por el curso heredan ese valor.",
      "  - No modifique los headers (entre corchetes). El parser los necesita.",
      "  - No agregue ni elimine filas: el conjunto de colaboradores es el de",
      "    asignados activos del curso al momento de descarga.",
    ]
    for (const linea of lineas) {
      hoja.addRow([linea])
    }
    const colA = hoja.getColumn(1)
    colA.width = 88
  }

  private buildHojaNotas(
    workbook: WorkbookType,
    asignados: readonly AsignadoTemplateRow[],
    skills: readonly SkillExigidaCursoTemplate[],
    areas: readonly AreaExigidaCursoTemplate[],
  ): void {
    const hoja = workbook.addWorksheet("Notas")

    const skillHeaders = skills.map((s) => `[SKILL:${s.skillId}|${s.etiquetaVisible}]`)
    const areaHeaders = areas.map((a) => `[AREA:${a.areaId}|${a.nombre}]`)

    const headers: readonly string[] = ["email", "nombre", ...skillHeaders, ...areaHeaders]
    hoja.addRow([...headers])

    const headerRow = hoja.getRow(1)
    headerRow.font = { bold: true }
    headerRow.alignment = { vertical: "middle", horizontal: "left" }

    hoja.getColumn(1).width = COLUMN_WIDTH_EMAIL
    hoja.getColumn(2).width = COLUMN_WIDTH_NOMBRE
    for (let idx = 3; idx <= headers.length; idx += 1) {
      hoja.getColumn(idx).width = COLUMN_WIDTH_NOTA
    }

    for (const asignado of asignados) {
      const fila: (string | number | null)[] = [asignado.email, asignado.nombre]
      for (let i = 0; i < skills.length + areas.length; i += 1) {
        fila.push(null)
      }
      hoja.addRow(fila)
    }
  }
}
