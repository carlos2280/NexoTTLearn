import { httpClient } from "@/shared/api/http-client"
import type {
  RepararSkillsCursoPreview,
  RepararSkillsCursoResponse,
} from "@nexott-learn/shared-types"

export function previsualizarRepararSkills(cursoId: string): Promise<RepararSkillsCursoPreview> {
  return httpClient.get<RepararSkillsCursoPreview>(`/cursos/${cursoId}/reparar-skills`)
}

export function repararSkills(cursoId: string): Promise<RepararSkillsCursoResponse> {
  return httpClient.post<RepararSkillsCursoResponse>(`/cursos/${cursoId}/reparar-skills`)
}
