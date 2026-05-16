import { ApiError } from "@/shared/api/api-error"
import type {
  ExportarColaboradoresQuery,
  FormatoExportColaboradores,
} from "@nexott-learn/shared-types"

const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1") as string
const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "true") === "true"

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

function buildQueryString(query: ExportarColaboradoresQuery): string {
  const params = new URLSearchParams()
  params.set("formato", query.formato)
  if (query.q) {
    params.set("q", query.q)
  }
  if (query.rol) {
    params.set("rol", query.rol)
  }
  if (query.estadoEmpleado) {
    params.set("estadoEmpleado", query.estadoEmpleado)
  }
  if (query.bloqueado !== undefined) {
    params.set("bloqueado", String(query.bloqueado))
  }
  return `?${params.toString()}`
}

export interface ExportDescargado {
  readonly blob: Blob
  readonly nombreArchivo: string
}

const FILENAME_REGEX = /filename="?([^";]+)"?/i

function extraerNombreArchivo(disposition: string | null, fallback: string): string {
  if (!disposition) {
    return fallback
  }
  const match = disposition.match(FILENAME_REGEX)
  return match?.[1] ?? fallback
}

export async function descargarExportColaboradores(
  query: ExportarColaboradoresQuery,
): Promise<ExportDescargado> {
  if (USE_MOCKS) {
    throw new ApiError(
      501,
      "EXPORT_NO_DISPONIBLE_EN_MOCKS",
      "La descarga real solo está disponible con el backend conectado (VITE_USE_MOCKS=false).",
    )
  }
  const headers: Record<string, string> = {}
  const xsrf = readCookie("XSRF-TOKEN")
  if (xsrf) {
    headers["X-XSRF-TOKEN"] = xsrf
  }
  const response = await fetch(`${BASE_URL}/colaboradores/exportar${buildQueryString(query)}`, {
    method: "GET",
    credentials: "include",
    headers,
  })
  if (!response.ok) {
    const text = await response.text()
    let parsed: { code?: string; message?: string } | null = null
    try {
      parsed = text ? (JSON.parse(text) as { code?: string; message?: string }) : null
    } catch {
      parsed = null
    }
    throw new ApiError(
      response.status,
      parsed?.code ?? "UNKNOWN_ERROR",
      parsed?.message ?? response.statusText,
    )
  }
  const fallback = `colaboradores.${query.formato}`
  return {
    blob: await response.blob(),
    nombreArchivo: extraerNombreArchivo(response.headers.get("content-disposition"), fallback),
  }
}

export function dispararDescarga(payload: ExportDescargado): void {
  const url = URL.createObjectURL(payload.blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = payload.nombreArchivo
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type { FormatoExportColaboradores }
