import { Injectable } from "@nestjs/common"
import { Workbook } from "exceljs"
import type { Cell, Row, Workbook as WorkbookType, Worksheet } from "exceljs"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import {
  CeldaError,
  FilaParseada,
  ParserEsperado,
  ParserInput,
  ParserResultado,
} from "./evaluacion-inicial.types"

const HEADER_REGEX = /^\[(SKILL|AREA):([^|]+)\|.+\]$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u
const HOJA_NOTAS = "Notas"
const HEADER_EMAIL = "email"
const HEADER_NOMBRE = "nombre"
const NOTA_MIN = 0
const NOTA_MAX = 100

type ColumnaTipo =
  | { readonly tipo: "EMAIL"; readonly indice: number }
  | { readonly tipo: "NOMBRE"; readonly indice: number }
  | { readonly tipo: "SKILL"; readonly indice: number; readonly skillId: string }
  | { readonly tipo: "AREA"; readonly indice: number; readonly areaId: string }

interface MapeoHeaders {
  readonly columnas: readonly ColumnaTipo[]
  readonly encabezadosFaltantes: readonly string[]
  readonly encabezadosInesperados: readonly string[]
}

/**
 * ExcelParserService — D-EVI-8 (Slice 5 P5b).
 *
 * Convierte un Excel cargado por un admin en un resultado tipado y validado
 * celda a celda. NO aplica el algoritmo "lo especifico gana" (eso lo hace
 * `PreviewService`) ni persiste nada: es un parser puro.
 *
 * Reglas duras:
 *   - Encabezados strict match contra los esperados (template generado por
 *     `ExcelTemplateService`). Cualquier divergencia (faltante o inesperado)
 *     hace que el caller dispare 422 `validacionExcelEncabezados`.
 *   - Email: validado con regex propio + lowercase para comparacion. El email
 *     del DB se preserva en la respuesta a traves de `emailsValidos`.
 *   - Celda vacia => `null` (no es error). Celda no numerica o fuera de
 *     [0, 100] => error de celda con codigo dedicado.
 *   - Las filas se numeran desde 2 (1 es header). El campo `celda` usa la
 *     letra de columna canonica (A, B, C...) seguida del numero de fila.
 */
@Injectable()
export class ExcelParserService {
  /**
   * Sanea un valor crudo del Excel para mostrarlo en mensajes de error:
   * limita a 80 chars y elimina caracteres susceptibles de XSS/HTML
   * (`<`, `>`, `"`). El destinatario del mensaje es el frontend, asi que
   * no podemos asumir que escape; defensa en profundidad.
   */
  private sanitizarValorCrudo(v: unknown): string {
    const s = String(v ?? "").slice(0, 80)
    return s.replace(/[<>"]/g, "?")
  }

  async parsear(input: ParserInput): Promise<ParserResultado> {
    const workbook = await this.cargarWorkbook(input.buffer)
    const hojaNotas = workbook.getWorksheet(HOJA_NOTAS)
    if (!hojaNotas) {
      const esperados = this.listaEncabezadosEsperados(input.esperado)
      return {
        filas: [],
        encabezadosFaltantes: esperados,
        encabezadosInesperados: [],
      }
    }

    const mapeo = this.mapearHeaders(hojaNotas, input.esperado)
    if (mapeo.encabezadosFaltantes.length > 0 || mapeo.encabezadosInesperados.length > 0) {
      return {
        filas: [],
        encabezadosFaltantes: mapeo.encabezadosFaltantes,
        encabezadosInesperados: mapeo.encabezadosInesperados,
      }
    }

    const filas: FilaParseada[] = []
    const emailsVistos = new Set<string>()
    const ultimaFila = hojaNotas.actualRowCount

    for (let nro = 2; nro <= ultimaFila; nro += 1) {
      const fila = this.parsearFila(hojaNotas, nro, mapeo, input.esperado, emailsVistos)
      if (fila) {
        filas.push(fila)
      }
    }

    return { filas, encabezadosFaltantes: [], encabezadosInesperados: [] }
  }

  private async cargarWorkbook(buffer: Buffer): Promise<WorkbookType> {
    const workbook = new Workbook()
    await workbook.xlsx.load(buffer)
    return workbook
  }

  private listaEncabezadosEsperados(esperado: ParserEsperado): string[] {
    const skill = esperado.skillsExigidas.map((s) => `[SKILL:${s.skillId}|${s.etiquetaVisible}]`)
    const area = esperado.areasExigidas.map((a) => `[AREA:${a.areaId}|${a.nombre}]`)
    return [HEADER_EMAIL, HEADER_NOMBRE, ...skill, ...area]
  }

  private mapearHeaders(hoja: Worksheet, esperado: ParserEsperado): MapeoHeaders {
    const presentes = this.leerHeadersPresentes(hoja)
    const skillIdsEsperados = new Set(esperado.skillsExigidas.map((s) => s.skillId))
    const areaIdsEsperados = new Set(esperado.areasExigidas.map((a) => a.areaId))
    const skillIdsVistos = new Set<string>()
    const areaIdsVistos = new Set<string>()
    const columnas: ColumnaTipo[] = []
    const inesperados: string[] = []

    let emailIndice = 0
    let nombreIndice = 0

    for (const { indice, valor } of presentes) {
      const clasificado = this.clasificarHeader(valor, indice, {
        skillIdsEsperados,
        areaIdsEsperados,
      })
      if (clasificado === "INESPERADO") {
        inesperados.push(valor)
        continue
      }
      columnas.push(clasificado)
      if (clasificado.tipo === "EMAIL") {
        emailIndice = indice
      } else if (clasificado.tipo === "NOMBRE") {
        nombreIndice = indice
      } else if (clasificado.tipo === "SKILL") {
        skillIdsVistos.add(clasificado.skillId)
      } else {
        areaIdsVistos.add(clasificado.areaId)
      }
    }

    const faltantes = this.listaFaltantes(esperado, {
      emailIndice,
      nombreIndice,
      skillIdsVistos,
      areaIdsVistos,
    })
    return { columnas, encabezadosFaltantes: faltantes, encabezadosInesperados: inesperados }
  }

  private leerHeadersPresentes(hoja: Worksheet): { indice: number; valor: string }[] {
    const headerRow = hoja.getRow(1)
    const presentes: { indice: number; valor: string }[] = []
    headerRow.eachCell((cell, colNumber) => {
      const valor = this.cellToString(cell)
      if (valor !== null) {
        presentes.push({ indice: colNumber, valor })
      }
    })
    return presentes
  }

  private clasificarHeader(
    valor: string,
    indice: number,
    ctx: { skillIdsEsperados: ReadonlySet<string>; areaIdsEsperados: ReadonlySet<string> },
  ): ColumnaTipo | "INESPERADO" {
    if (valor === HEADER_EMAIL) {
      return { tipo: "EMAIL", indice }
    }
    if (valor === HEADER_NOMBRE) {
      return { tipo: "NOMBRE", indice }
    }
    const match = HEADER_REGEX.exec(valor)
    const tipoColumna = match?.[1]
    const id = match?.[2]
    if (!(tipoColumna && id)) {
      return "INESPERADO"
    }
    if (tipoColumna === "SKILL") {
      return ctx.skillIdsEsperados.has(id) ? { tipo: "SKILL", indice, skillId: id } : "INESPERADO"
    }
    return ctx.areaIdsEsperados.has(id) ? { tipo: "AREA", indice, areaId: id } : "INESPERADO"
  }

  private listaFaltantes(
    esperado: ParserEsperado,
    ctx: {
      emailIndice: number
      nombreIndice: number
      skillIdsVistos: ReadonlySet<string>
      areaIdsVistos: ReadonlySet<string>
    },
  ): string[] {
    const faltantes: string[] = []
    if (ctx.emailIndice === 0) {
      faltantes.push(HEADER_EMAIL)
    }
    if (ctx.nombreIndice === 0) {
      faltantes.push(HEADER_NOMBRE)
    }
    for (const s of esperado.skillsExigidas) {
      if (!ctx.skillIdsVistos.has(s.skillId)) {
        faltantes.push(`[SKILL:${s.skillId}|${s.etiquetaVisible}]`)
      }
    }
    for (const a of esperado.areasExigidas) {
      if (!ctx.areaIdsVistos.has(a.areaId)) {
        faltantes.push(`[AREA:${a.areaId}|${a.nombre}]`)
      }
    }
    return faltantes
  }

  private parsearFila(
    hoja: Worksheet,
    nroFila: number,
    mapeo: MapeoHeaders,
    esperado: ParserEsperado,
    emailsVistos: Set<string>,
  ): FilaParseada | null {
    const row = hoja.getRow(nroFila)
    if (!row.hasValues) {
      return null
    }

    const errores: CeldaError[] = []
    const valoresSkill = new Map<string, number | null>()
    const valoresArea = new Map<string, number | null>()
    const emailParsed = this.extraerEmail(row, mapeo, nroFila, errores)
    const nombre = this.extraerNombre(row, mapeo)
    this.extraerValoresCeldas(row, mapeo, nroFila, {
      errores,
      valoresSkill,
      valoresArea,
    })
    this.verificarEmailContraEsperado(emailParsed, mapeo, nroFila, errores, emailsVistos, esperado)

    if (errores.length > 0) {
      return {
        tipo: "RECHAZADA",
        numero: nroFila,
        email: emailParsed.crudo,
        errores,
      }
    }
    if (!emailParsed.normalizado) {
      return null
    }
    const asignado = esperado.emailsValidos.get(emailParsed.normalizado)
    if (!asignado) {
      // Defensa en profundidad: ya cubierto arriba; nunca deberia llegar aqui.
      return null
    }
    return {
      tipo: "VALIDA",
      numero: nroFila,
      email: emailParsed.normalizado,
      colaboradorId: asignado.colaboradorId,
      nombre: nombre || asignado.nombre,
      valoresSkill,
      valoresArea,
    }
  }

  private extraerEmail(
    row: Row,
    mapeo: MapeoHeaders,
    nroFila: number,
    errores: CeldaError[],
  ): { crudo: string | null; normalizado: string | null } {
    const emailCol = mapeo.columnas.find((c) => c.tipo === "EMAIL")
    if (!emailCol) {
      return { crudo: null, normalizado: null }
    }
    const cell = row.getCell(emailCol.indice)
    const celdaRef = this.celdaRef(emailCol.indice, nroFila)
    const raw = this.cellToString(cell)
    if (raw === null) {
      errores.push({
        celda: celdaRef,
        codigo: apiErrorCodes.validacionExcelEmailFormatoInvalido,
        mensaje: "Email vacio.",
      })
      return { crudo: null, normalizado: null }
    }
    const crudo = raw.trim()
    const lower = crudo.toLowerCase()
    if (!EMAIL_REGEX.test(lower)) {
      errores.push({
        celda: celdaRef,
        codigo: apiErrorCodes.validacionExcelEmailFormatoInvalido,
        mensaje: `Email "${this.sanitizarValorCrudo(crudo)}" tiene formato invalido.`,
      })
      return { crudo, normalizado: null }
    }
    return { crudo, normalizado: lower }
  }

  private extraerNombre(row: Row, mapeo: MapeoHeaders): string {
    const nombreCol = mapeo.columnas.find((c) => c.tipo === "NOMBRE")
    if (!nombreCol) {
      return ""
    }
    return this.cellToString(row.getCell(nombreCol.indice))?.trim() ?? ""
  }

  private extraerValoresCeldas(
    row: Row,
    mapeo: MapeoHeaders,
    nroFila: number,
    out: {
      errores: CeldaError[]
      valoresSkill: Map<string, number | null>
      valoresArea: Map<string, number | null>
    },
  ): void {
    for (const col of mapeo.columnas) {
      if (col.tipo !== "SKILL" && col.tipo !== "AREA") {
        continue
      }
      const cell = row.getCell(col.indice)
      const celdaRef = this.celdaRef(col.indice, nroFila)
      const parsed = this.parsearCeldaNota(cell, celdaRef)
      if (parsed.error) {
        out.errores.push(parsed.error)
        continue
      }
      if (col.tipo === "SKILL") {
        out.valoresSkill.set(col.skillId, parsed.valor)
      } else {
        out.valoresArea.set(col.areaId, parsed.valor)
      }
    }
  }

  private verificarEmailContraEsperado(
    emailParsed: { crudo: string | null; normalizado: string | null },
    mapeo: MapeoHeaders,
    nroFila: number,
    errores: CeldaError[],
    emailsVistos: Set<string>,
    esperado: ParserEsperado,
  ): void {
    const normalizado = emailParsed.normalizado
    if (!normalizado) {
      return
    }
    const emailCol = mapeo.columnas.find((c) => c.tipo === "EMAIL")
    const celdaRef = this.celdaRef(emailCol?.indice ?? 1, nroFila)
    if (emailsVistos.has(normalizado)) {
      errores.push({
        celda: celdaRef,
        codigo: apiErrorCodes.validacionExcelEmailDuplicadoEnArchivo,
        mensaje: `Email "${this.sanitizarValorCrudo(normalizado)}" aparece duplicado en el archivo.`,
      })
      return
    }
    emailsVistos.add(normalizado)
    if (!esperado.emailsValidos.has(normalizado)) {
      errores.push({
        celda: celdaRef,
        codigo: apiErrorCodes.validacionExcelEmailNoAsignado,
        mensaje: `Email "${this.sanitizarValorCrudo(normalizado)}" no corresponde a un colaborador asignado al curso.`,
      })
    }
  }

  private parsearCeldaNota(
    cell: Cell,
    celdaRef: string,
  ): { valor: number | null; error: CeldaError | null } {
    const valor = cell.value
    if (valor === null || valor === undefined) {
      return { valor: null, error: null }
    }
    if (typeof valor === "string" && valor.trim() === "") {
      return { valor: null, error: null }
    }
    let num: number
    if (typeof valor === "number") {
      num = valor
    } else if (typeof valor === "string") {
      const parsed = Number(valor.trim().replace(",", "."))
      if (Number.isNaN(parsed)) {
        return {
          valor: null,
          error: {
            celda: celdaRef,
            codigo: apiErrorCodes.validacionExcelNotaNoNumerica,
            mensaje: `Valor "${this.sanitizarValorCrudo(valor)}" no es numerico.`,
          },
        }
      }
      num = parsed
    } else {
      return {
        valor: null,
        error: {
          celda: celdaRef,
          codigo: apiErrorCodes.validacionExcelNotaNoNumerica,
          mensaje: "Valor no numerico.",
        },
      }
    }
    if (!Number.isFinite(num)) {
      return {
        valor: null,
        error: {
          celda: celdaRef,
          codigo: apiErrorCodes.validacionExcelNotaNoNumerica,
          mensaje: "Valor no numerico.",
        },
      }
    }
    if (num < NOTA_MIN || num > NOTA_MAX) {
      return {
        valor: null,
        error: {
          celda: celdaRef,
          codigo: apiErrorCodes.validacionExcelNotaFueraRango,
          mensaje: `Valor ${this.sanitizarValorCrudo(num)} fuera del rango [${NOTA_MIN}, ${NOTA_MAX}].`,
        },
      }
    }
    return { valor: num, error: null }
  }

  private cellToString(cell: Cell): string | null {
    const valor = cell.value
    if (valor === null || valor === undefined) {
      return null
    }
    if (typeof valor === "string") {
      return valor
    }
    if (typeof valor === "number" || typeof valor === "boolean") {
      return String(valor)
    }
    if (valor instanceof Date) {
      return valor.toISOString()
    }
    if (typeof valor === "object" && "text" in valor && typeof valor.text === "string") {
      return valor.text
    }
    if (
      typeof valor === "object" &&
      "richText" in valor &&
      Array.isArray((valor as { richText: { text: string }[] }).richText)
    ) {
      return (valor as { richText: { text: string }[] }).richText.map((r) => r.text).join("")
    }
    return null
  }

  private celdaRef(colIndex: number, rowIndex: number): string {
    let n = colIndex
    let letras = ""
    while (n > 0) {
      const mod = (n - 1) % 26
      letras = String.fromCharCode(65 + mod) + letras
      n = Math.floor((n - 1) / 26)
    }
    return `${letras}${rowIndex}`
  }
}
