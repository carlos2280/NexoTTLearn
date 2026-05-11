import { ApiError } from "./api-error"
import { mockHandle } from "./mocks/router"

const BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1") as string
const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "true") === "true"

export const EVENTO_NO_AUTORIZADO = "nexott:unauthorized"

const RUTAS_DONDE_401_ES_ESPERADO: readonly string[] = ["/auth/login", "/auth/mfa/verify"]

function emitirNoAutorizado(path: string): void {
  if (typeof window === "undefined") {
    return
  }
  if (RUTAS_DONDE_401_ES_ESPERADO.some((r) => path.startsWith(r))) {
    return
  }
  window.dispatchEvent(new CustomEvent(EVENTO_NO_AUTORIZADO))
}

interface RequestOptions {
  readonly signal?: AbortSignal
  readonly idempotencyKey?: string
  readonly motivo?: string
}

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

function buildHeaders(hasBody: boolean, options?: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {}
  if (hasBody) {
    headers["Content-Type"] = "application/json"
  }
  if (options?.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey
  }
  if (options?.motivo) {
    headers["X-Motivo"] = options.motivo
  }
  const xsrf = readCookie("XSRF-TOKEN")
  if (xsrf) {
    headers["X-XSRF-TOKEN"] = xsrf
  }
  return headers
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const headers = buildHeaders(body !== undefined, options)

  if (USE_MOCKS) {
    return mockHandle<T>({ method, path, body, headers })
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const data = text ? safeJsonParse(text) : null

  if (!response.ok) {
    const errorData = (data ?? {}) as {
      code?: string
      message?: string
      details?: unknown
    }
    if (response.status === 401) {
      emitirNoAutorizado(path)
    }
    throw new ApiError(
      response.status,
      errorData.code ?? "UNKNOWN_ERROR",
      errorData.message ?? response.statusText,
      errorData.details,
    )
  }

  return data as T
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body: unknown, options?: RequestOptions): Promise<T> =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body: unknown, options?: RequestOptions): Promise<T> =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions & { readonly body?: unknown }): Promise<T> =>
    request<T>("DELETE", path, options?.body, options),
}
