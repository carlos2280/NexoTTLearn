import { ApiError } from "@/shared/api/api-error"
import { httpClient } from "@/shared/api/http-client"
import type {
  AplicarRequest,
  AplicarResponse,
  CargaEvaluacionInicialResumen,
  PaginacionQuery,
  Paginated,
  PreviewResponse,
} from "@nexott-learn/shared-types"

const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1") as string

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  if (!match || match[1] === undefined) {
    return null
  }
  return decodeURIComponent(match[1])
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extra ?? {}) }
  const xsrf = readCookie("XSRF-TOKEN")
  if (xsrf) {
    headers["X-XSRF-TOKEN"] = xsrf
  }
  return headers
}

async function throwApiError(response: Response): Promise<never> {
  const text = await response.text()
  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }
  const data = (parsed ?? {}) as { code?: string; message?: string; details?: unknown }
  throw new ApiError(
    response.status,
    data.code ?? "UNKNOWN_ERROR",
    data.message ?? response.statusText,
    data.details,
  )
}

export async function descargarTemplate(cursoId: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/cursos/${cursoId}/evaluacion-inicial/template`, {
    method: "GET",
    credentials: "include",
    headers: buildAuthHeaders(),
  })
  if (!response.ok) {
    await throwApiError(response)
  }
  return response.blob()
}

export async function crearPreview(cursoId: string, archivo: File): Promise<PreviewResponse> {
  const form = new FormData()
  form.append("archivo", archivo, archivo.name)
  const response = await fetch(`${BASE_URL}/cursos/${cursoId}/evaluacion-inicial/preview`, {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(),
    body: form,
  })
  if (!response.ok) {
    await throwApiError(response)
  }
  return response.json() as Promise<PreviewResponse>
}

export function descartarPreview(cursoId: string, previewId: string): Promise<void> {
  return httpClient.delete<void>(`/cursos/${cursoId}/evaluacion-inicial/${previewId}`)
}

export function aplicarPreview(
  cursoId: string,
  previewId: string,
  body: AplicarRequest,
  idempotencyKey: string,
): Promise<AplicarResponse> {
  return httpClient.post<AplicarResponse>(
    `/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`,
    body,
    { idempotencyKey },
  )
}

export function listarHistorial(
  cursoId: string,
  query: PaginacionQuery,
): Promise<Paginated<CargaEvaluacionInicialResumen>> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  })
  return httpClient.get<Paginated<CargaEvaluacionInicialResumen>>(
    `/cursos/${cursoId}/evaluacion-inicial/historial?${params.toString()}`,
  )
}
