import { ApiError } from "@/shared/api/api-error"
import type { FormatoExportFicha } from "@nexott-learn/shared-types"

const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1") as string
const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "true") === "true"
const FILENAME_REGEX = /filename="?([^";]+)"?/i

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

function extraerNombreArchivo(disposition: string | null, fallback: string): string {
  if (!disposition) {
    return fallback
  }
  const match = disposition.match(FILENAME_REGEX)
  return match?.[1] ?? fallback
}

export interface FichaDescargada {
  readonly blob: Blob
  readonly nombreArchivo: string
}

/**
 * Descarga binaria de la ficha del colaborador en sesion (B-25 / D90 §20.3).
 * Mismo patron que `descargarExportColaboradores`: fetch directo con
 * `credentials: include` + `X-XSRF-TOKEN` (no pasa por `httpClient` porque
 * la respuesta es binario, no JSON envelope).
 */
export async function descargarMiFicha(formato: FormatoExportFicha): Promise<FichaDescargada> {
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
  const response = await fetch(`${BASE_URL}/me/ficha/exportar?formato=${formato}`, {
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
  return {
    blob: await response.blob(),
    nombreArchivo: extraerNombreArchivo(
      response.headers.get("content-disposition"),
      `ficha.${formato}`,
    ),
  }
}

export function dispararDescargaFicha(payload: FichaDescargada): void {
  const url = URL.createObjectURL(payload.blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = payload.nombreArchivo
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
