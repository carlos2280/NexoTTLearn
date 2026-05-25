import { httpClient } from "@/shared/api/http-client"
import type {
  ActualizarAreasCursoInput,
  ActualizarCursoInput,
  ActualizarEntrevistaIaCursoInput,
  ActualizarModulosHabilitadosCursoInput,
  ActualizarPesosCursoInput,
  ActualizarSkillsExigidasCursoInput,
  ActualizarTransversalCursoInput,
  ActualizarUmbralesLogroCursoInput,
  CerrarCursoInput,
  CrearCursoInput,
  CursoConfiguracionResponse,
  CursoDetalle,
  CursoResumen,
  DuplicarCursoInput,
  DuplicarCursoResponse,
  ListarCursosQuery,
  ListarLogCambiosQuery,
  LogCambioCurso,
  Paginated,
  ReordenarModulosHabilitadosCursoInput,
} from "@nexott-learn/shared-types"

function buildQueryString(query: ListarCursosQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.estado) {
    params.set("estado", query.estado)
  }
  if (query.clienteId) {
    params.set("clienteId", query.clienteId)
  }
  if (query.q && query.q.trim().length > 0) {
    params.set("q", query.q.trim())
  }
  if (query.incluirArchivados) {
    // biome-ignore lint/nursery/noSecrets: falso positivo por la longitud del nombre del query param
    params.set("incluirArchivados", "true")
  }
  if (query.fechaDeadlineDesde) {
    // biome-ignore lint/nursery/noSecrets: falso positivo por la longitud del nombre del query param
    params.set("fechaDeadlineDesde", query.fechaDeadlineDesde)
  }
  if (query.fechaDeadlineHasta) {
    // biome-ignore lint/nursery/noSecrets: falso positivo por la longitud del nombre del query param
    params.set("fechaDeadlineHasta", query.fechaDeadlineHasta)
  }
  if (query.sort) {
    params.set("sort", query.sort)
  }
  return `?${params.toString()}`
}

export function listarCursos(query: ListarCursosQuery): Promise<Paginated<CursoResumen>> {
  return httpClient.get<Paginated<CursoResumen>>(`/cursos${buildQueryString(query)}`)
}

export function obtenerCurso(id: string): Promise<CursoDetalle> {
  return httpClient.get<CursoDetalle>(`/cursos/${id}`)
}

export function crearCurso(input: CrearCursoInput): Promise<CursoDetalle> {
  return httpClient.post<CursoDetalle>("/cursos", input)
}

export function actualizarCurso(
  id: string,
  input: ActualizarCursoInput,
  motivo: string | undefined,
): Promise<CursoDetalle> {
  return httpClient.patch<CursoDetalle>(`/cursos/${id}`, input, { motivo })
}

export function eliminarCurso(id: string): Promise<void> {
  return httpClient.delete<void>(`/cursos/${id}`)
}

export function publicarCurso(id: string, motivo: string | undefined): Promise<CursoDetalle> {
  return httpClient.post<CursoDetalle>(`/cursos/${id}/publicar`, undefined, { motivo })
}

export function archivarCurso(id: string, motivo: string): Promise<CursoDetalle> {
  return httpClient.post<CursoDetalle>(`/cursos/${id}/archivar`, undefined, { motivo })
}

export function desarchivarCurso(id: string): Promise<CursoDetalle> {
  return httpClient.post<CursoDetalle>(`/cursos/${id}/desarchivar`)
}

export function duplicarCurso(
  id: string,
  input: DuplicarCursoInput,
  motivo: string,
): Promise<DuplicarCursoResponse> {
  return httpClient.post<DuplicarCursoResponse>(`/cursos/${id}/duplicar`, input, { motivo })
}

export function cerrarCurso(
  id: string,
  input: CerrarCursoInput,
  motivo: string,
  idempotencyKey: string,
): Promise<CursoDetalle> {
  return httpClient.post<CursoDetalle>(`/cursos/${id}/cerrar`, input, {
    motivo,
    idempotencyKey,
  })
}

export function deshacerCierreCurso(
  id: string,
  motivo: string,
  idempotencyKey: string,
): Promise<CursoDetalle> {
  return httpClient.post<CursoDetalle>(`/cursos/${id}/deshacer-cierre`, undefined, {
    motivo,
    idempotencyKey,
  })
}

function buildLogQueryString(query: ListarLogCambiosQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  return `?${params.toString()}`
}

export function listarLogCambios(
  cursoId: string,
  query: ListarLogCambiosQuery,
): Promise<Paginated<LogCambioCurso>> {
  return httpClient.get<Paginated<LogCambioCurso>>(
    `/cursos/${cursoId}/log-cambios${buildLogQueryString(query)}`,
  )
}

// ---- Configuración (P4b) ----

export function actualizarAreasCurso(
  cursoId: string,
  input: ActualizarAreasCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(`/cursos/${cursoId}/areas`, input, { motivo })
}

export function actualizarSkillsExigidasCurso(
  cursoId: string,
  input: ActualizarSkillsExigidasCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(`/cursos/${cursoId}/skills-exigidas`, input, {
    motivo,
  })
}

export function actualizarModulosHabilitadosCurso(
  cursoId: string,
  input: ActualizarModulosHabilitadosCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(
    `/cursos/${cursoId}/modulos-habilitados`,
    input,
    { motivo },
  )
}

export function reordenarModulosHabilitadosCurso(
  cursoId: string,
  input: ReordenarModulosHabilitadosCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(
    `/cursos/${cursoId}/modulos-habilitados/orden`,
    input,
    { motivo },
  )
}

export function actualizarPesosCurso(
  cursoId: string,
  input: ActualizarPesosCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(`/cursos/${cursoId}/pesos`, input, { motivo })
}

export function actualizarUmbralesLogroCurso(
  cursoId: string,
  input: ActualizarUmbralesLogroCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(`/cursos/${cursoId}/umbrales-logro`, input, {
    motivo,
  })
}

export function actualizarTransversalCurso(
  cursoId: string,
  input: ActualizarTransversalCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(`/cursos/${cursoId}/transversal`, input, {
    motivo,
  })
}

export function actualizarEntrevistaIaCurso(
  cursoId: string,
  input: ActualizarEntrevistaIaCursoInput,
  motivo: string | undefined,
): Promise<CursoConfiguracionResponse> {
  return httpClient.patch<CursoConfiguracionResponse>(`/cursos/${cursoId}/entrevista-ia`, input, {
    motivo,
  })
}
