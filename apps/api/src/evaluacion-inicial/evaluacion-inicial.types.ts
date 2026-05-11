// =============================================================================
// Tipos internos compartidos por servicios P5a + P5b.
// =============================================================================

export interface AsignadoTemplateRow {
  readonly colaboradorId: string
  readonly email: string
  readonly nombre: string
}

export interface SkillExigidaCursoTemplate {
  readonly skillId: string
  readonly etiquetaVisible: string
  readonly areaId: string
}

export interface AreaExigidaCursoTemplate {
  readonly areaId: string
  readonly nombre: string
}

export interface ExcelTemplateResult {
  readonly buffer: Buffer
  readonly skillsExigidas: number
  readonly areasExigidas: number
  readonly asignados: number
}

// =============================================================================
// Parser P5b — D-EVI-8.
// =============================================================================

export interface ColaboradorAsignadoValido {
  readonly colaboradorId: string
  readonly nombre: string
}

export interface ParserEsperado {
  readonly skillsExigidas: readonly SkillExigidaCursoTemplate[]
  readonly areasExigidas: readonly AreaExigidaCursoTemplate[]
  readonly skillsPorArea: ReadonlyMap<string, readonly string[]>
  readonly emailsValidos: ReadonlyMap<string, ColaboradorAsignadoValido>
}

export interface ParserInput {
  readonly buffer: Buffer
  readonly esperado: ParserEsperado
}

export interface CeldaError {
  readonly celda: string
  readonly codigo: string
  readonly mensaje: string
}

export interface FilaParseadaValida {
  readonly tipo: "VALIDA"
  readonly numero: number
  readonly email: string
  readonly colaboradorId: string
  readonly nombre: string
  readonly valoresSkill: ReadonlyMap<string, number | null>
  readonly valoresArea: ReadonlyMap<string, number | null>
}

export interface FilaParseadaRechazada {
  readonly tipo: "RECHAZADA"
  readonly numero: number
  readonly email: string | null
  readonly errores: readonly CeldaError[]
}

export type FilaParseada = FilaParseadaValida | FilaParseadaRechazada

export interface ParserResultado {
  readonly filas: readonly FilaParseada[]
  readonly encabezadosFaltantes: readonly string[]
  readonly encabezadosInesperados: readonly string[]
}
