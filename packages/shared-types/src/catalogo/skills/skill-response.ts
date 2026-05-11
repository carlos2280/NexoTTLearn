import type { EstadoSkill } from "./listar-skills.schema"
import type { ReferenciasMigradasFusion } from "./skill.schema"

export interface SkillResponse {
  readonly id: string
  readonly etiquetaVisible: string
  readonly areaId: string
  readonly estado: EstadoSkill
  readonly createdAt: string
  readonly updatedAt: string
}

/**
 * P3b — respuesta de POST /api/v1/catalogo/skills/fusionar. Devuelve ambas
 * skills (ganadora actualizada y perdedora ya en estado ARCHIVADA) y el
 * conteo de referencias migradas por tipo de tabla.
 */
export interface FusionSkillsResponse {
  readonly skillGanadora: SkillResponse
  readonly skillPerdedora: SkillResponse
  readonly referenciasMigradas: ReferenciasMigradasFusion
}
