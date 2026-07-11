import { ApiError } from "@/shared/api/api-error"
import { API_BASE_URL } from "@/shared/api/base-url"
import { obtenerCsrfToken } from "@/shared/api/csrf"
import { type SubirImagenResponse, subirImagenResponseSchema } from "@nexott-learn/shared-types"

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

/**
 * Sube una imagen de contenido (`POST /imagenes`) vía multipart. No pasa por el
 * `httpClient` (que serializa JSON): FormData necesita fetch directo para que el
 * navegador ponga el `Content-Type` con boundary. El token CSRF viene de la
 * fuente de verdad del cliente (memoria/sessionStorage/cookie), que funciona
 * aunque la web y la API vivan en dominios distintos.
 */
export async function subirImagen(archivo: File): Promise<SubirImagenResponse> {
  const form = new FormData()
  form.append("archivo", archivo, archivo.name)

  const headers: Record<string, string> = {}
  const csrf = obtenerCsrfToken()
  if (csrf) {
    headers["X-XSRF-TOKEN"] = csrf
  }

  const response = await fetch(`${API_BASE_URL}/imagenes`, {
    method: "POST",
    credentials: "include",
    headers,
    body: form,
  })
  if (!response.ok) {
    await throwApiError(response)
  }
  return subirImagenResponseSchema.parse(await response.json())
}
