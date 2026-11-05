/**
 * POST /api/v1/cursos/:cursoId/reparar-skills — ADMIN.
 * Completa las skills que le faltan a un curso ya cargado (bloques evaluables
 * sin skill, secciones sin skill, skills y area exigidas) y recalcula los
 * planes de sus asignados. Solo agrega: nunca quita ni sube versiones.
 */
export interface RepararSkillsCursoResponse {
  readonly cursoId: string
  readonly bloquesCompletados: number
  readonly seccionesCompletadas: number
  readonly skillsExigidasAgregadas: number
  readonly areaExigidaAgregada: boolean
  readonly planes: {
    readonly total: number
    readonly recalculados: number
    readonly fallidos: number
  }
}
