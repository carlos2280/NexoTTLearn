// En dev: el proxy de Vite redirige /api a localhost:4000 (vite.config.ts).
// En prod: VITE_API_URL apunta al dominio absoluto de la API. Vite la inlinea en build-time.
import { apiErrorBodySchema } from "@nexott-learn/shared-types"
import { ApiError } from "./api-error"

const BASE = `${import.meta.env.VITE_API_URL ?? ""}/api`

interface RequestOptions {
  readonly signal?: AbortSignal
}

// Endpoints donde un 401 es estado valido (no hay sesion), no un error de
// expiracion. /auth/me se llama desde guards y paginas publicas; /auth/login
// devuelve 401 con INVALID_CREDENTIALS que el form maneja localmente.
const UNAUTHORIZED_SAFE_PATHS = new Set(["/auth/me", "/auth/login"])

let onUnauthorized: ((path: string) => void) | null = null

/**
 * Registra un callback que se ejecuta cuando un 401 ocurre en un endpoint
 * que NO sea de auth publica. Tipico uso: cookie expiro mid-session, hay que
 * invalidar el cache de usuario y redirigir a /login.
 */
export function setOnUnauthorized(handler: (path: string) => void): void {
  onUnauthorized = handler
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const data: unknown = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === 401 && !UNAUTHORIZED_SAFE_PATHS.has(path)) {
      onUnauthorized?.(path)
    }
    throw construirApiError(response.status, data)
  }

  return data as T
}

function construirApiError(status: number, data: unknown): ApiError {
  const parsed = apiErrorBodySchema.safeParse(data)
  if (parsed.success) {
    return new ApiError({
      status,
      code: parsed.data.code,
      message: parsed.data.message,
      fieldErrors: parsed.data.fieldErrors,
      retryAfter: parsed.data.retryAfter,
    })
  }
  return new ApiError({
    status,
    code: "INTERNAL",
    message: `Error ${status}`,
  })
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body: unknown, options?: RequestOptions): Promise<T> =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body: unknown, options?: RequestOptions): Promise<T> =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body: unknown, options?: RequestOptions): Promise<T> =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions): Promise<T> =>
    request<T>("DELETE", path, undefined, options),
}
