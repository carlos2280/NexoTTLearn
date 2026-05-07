import { httpClient } from "@/shared/api/http-client"
import {
  type InscripcionDeleteAdminResponse,
  type InscripcionDiagnosticoListResponse,
  type ListarInscripcionesCursoQuery,
  inscripcionDeleteAdminResponseSchema,
  inscripcionDiagnosticoListResponseSchema,
} from "@nexott-learn/shared-types"

export async function listarInscripcionesCurso(
  cursoId: string,
  query: Partial<ListarInscripcionesCursoQuery> = {},
): Promise<InscripcionDiagnosticoListResponse> {
  const search = new URLSearchParams()
  if (query.q) {
    search.set("q", query.q)
  }
  if (query.estadoInvitado) {
    search.set("estadoInvitado", query.estadoInvitado)
  }
  if (query.tieneEvaluacion) {
    search.set("tieneEvaluacion", query.tieneEvaluacion)
  }
  if (query.page !== undefined) {
    search.set("page", String(query.page))
  }
  if (query.pageSize !== undefined) {
    search.set("pageSize", String(query.pageSize))
  }
  const qs = search.toString()
  const base = `/admin/cursos/${cursoId}/inscripciones`
  const path = qs ? `${base}?${qs}` : base
  const data = await httpClient.get<InscripcionDiagnosticoListResponse>(path)
  return inscripcionDiagnosticoListResponseSchema.parse(data)
}

export async function quitarInscripcionDelCurso(
  cursoId: string,
  inscripcionId: string,
): Promise<InscripcionDeleteAdminResponse> {
  const data = await httpClient.delete<InscripcionDeleteAdminResponse>(
    `/admin/cursos/${cursoId}/inscripciones/${inscripcionId}`,
  )
  return inscripcionDeleteAdminResponseSchema.parse(data)
}
