const BASE = "/api"

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors?: Record<string, string[]>

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  const data: unknown = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = extraerMensaje(data) ?? `Error ${res.status}`
    const fieldErrors = extraerFieldErrors(data)
    throw new ApiError(message, res.status, fieldErrors)
  }

  return data as T
}

function extraerMensaje(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "message" in data) {
    const msg = (data as { message: unknown }).message
    if (typeof msg === "string") {
      return msg
    }
  }
  return undefined
}

function extraerFieldErrors(data: unknown): Record<string, string[]> | undefined {
  if (typeof data === "object" && data !== null && "errors" in data) {
    const errors = (data as { errors: unknown }).errors
    if (typeof errors === "object" && errors !== null) {
      return errors as Record<string, string[]>
    }
  }
  return undefined
}
