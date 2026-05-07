import { httpClient } from "@/shared/api/http-client"
import {
  type EvaluacionInicialDetalleAdmin,
  type MatrizDiagnosticoQuery,
  type MatrizDiagnosticoResponse,
  type UpsertEvaluacionInicialAdminInput,
  evaluacionInicialDetalleAdminSchema,
  matrizDiagnosticoResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerMatrizDiagnostico(
  cursoId: string,
  query: Partial<MatrizDiagnosticoQuery> = {},
): Promise<MatrizDiagnosticoResponse> {
  const search = new URLSearchParams()
  if (query.q) {
    search.set("q", query.q)
  }
  if (query.soloSinDatos !== undefined) {
    search.set("soloSinDatos", String(query.soloSinDatos))
  }
  const qs = search.toString()
  const base = `/admin/cursos/${cursoId}/diagnostico/matriz`
  const path = qs ? `${base}?${qs}` : base
  const data = await httpClient.get<MatrizDiagnosticoResponse>(path)
  return matrizDiagnosticoResponseSchema.parse(data)
}

export async function upsertEvaluacionCelda(
  inscripcionId: string,
  areaId: string,
  input: UpsertEvaluacionInicialAdminInput,
): Promise<EvaluacionInicialDetalleAdmin> {
  const data = await httpClient.put<EvaluacionInicialDetalleAdmin>(
    `/admin/inscripciones/${inscripcionId}/evaluaciones-iniciales/${areaId}`,
    input,
  )
  return evaluacionInicialDetalleAdminSchema.parse(data)
}
