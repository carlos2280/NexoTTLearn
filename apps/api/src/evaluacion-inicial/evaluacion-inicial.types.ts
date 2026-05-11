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
