import type { EstadoSkill } from "./listar-skills.schema"

export interface SkillResponse {
  readonly id: string
  readonly etiquetaVisible: string
  readonly areaId: string
  readonly estado: EstadoSkill
  readonly createdAt: string
  readonly updatedAt: string
}
