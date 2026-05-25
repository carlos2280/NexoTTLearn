import { httpClient } from "@/shared/api/http-client"
import type {
  CambiarAreaSkillInput,
  CrearSkillInput,
  FusionSkillsResponse,
  FusionarSkillsInput,
  ListarSkillsQuery,
  Paginated,
  PreviewCambioAreaResponse,
  RenombrarSkillInput,
  SkillResponse,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ListarSkillsQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.areaId) {
    params.set("areaId", query.areaId)
  }
  if (query.estado) {
    params.set("estado", query.estado)
  }
  if (query.q && query.q.trim().length > 0) {
    params.set("q", query.q.trim())
  }
  return `?${params.toString()}`
}

export function listarSkills(query: ListarSkillsQuery): Promise<Paginated<SkillResponse>> {
  return httpClient.get<Paginated<SkillResponse>>(`/catalogo/skills${buildQueryString(query)}`)
}

export function crearSkill(input: CrearSkillInput): Promise<SkillResponse> {
  return httpClient.post<SkillResponse>("/catalogo/skills", input)
}

export function renombrarSkill(
  id: string,
  input: RenombrarSkillInput,
  motivo: string,
): Promise<SkillResponse> {
  return httpClient.patch<SkillResponse>(`/catalogo/skills/${id}`, input, { motivo })
}

export function archivarSkill(id: string, motivo: string): Promise<void> {
  return httpClient.post<void>(`/catalogo/skills/${id}/archivar`, undefined, { motivo })
}

export function desarchivarSkill(id: string): Promise<void> {
  return httpClient.post<void>(`/catalogo/skills/${id}/desarchivar`, undefined)
}

export function eliminarSkill(id: string, motivo: string): Promise<void> {
  return httpClient.delete<void>(`/catalogo/skills/${id}`, { motivo })
}

export function previewCambioAreaSkill(
  id: string,
  input: CambiarAreaSkillInput,
): Promise<PreviewCambioAreaResponse> {
  return httpClient.post<PreviewCambioAreaResponse>(
    `/catalogo/skills/${id}/preview-cambio-area`,
    input,
  )
}

export function cambiarAreaSkill(
  id: string,
  input: CambiarAreaSkillInput,
  motivo: string,
): Promise<SkillResponse> {
  return httpClient.post<SkillResponse>(`/catalogo/skills/${id}/area`, input, { motivo })
}

export function fusionarSkills(
  input: FusionarSkillsInput,
  motivo: string,
): Promise<FusionSkillsResponse> {
  return httpClient.post<FusionSkillsResponse>("/catalogo/skills/fusionar", input, { motivo })
}
