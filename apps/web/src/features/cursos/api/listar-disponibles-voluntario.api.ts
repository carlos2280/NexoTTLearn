import { httpClient } from "@/shared/api/http-client"
import type { CursoDisponibleVoluntario, Paginated } from "@nexott-learn/shared-types"

export function listarCursosDisponiblesVoluntario(params?: {
  readonly page?: number
  readonly pageSize?: number
}): Promise<Paginated<CursoDisponibleVoluntario>> {
  const qs = new URLSearchParams()
  if (params?.page !== undefined) {
    qs.set("page", String(params.page))
  }
  if (params?.pageSize !== undefined) {
    qs.set("pageSize", String(params.pageSize))
  }
  const search = qs.toString()
  return httpClient.get<Paginated<CursoDisponibleVoluntario>>(
    `/cursos/disponibles-voluntario${search ? `?${search}` : ""}`,
  )
}
