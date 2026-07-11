// Token CSRF en memoria + sessionStorage (sobrevive refresh dentro de la pestaña,
// no entre pestañas ni sesiones). Necesario cuando la web y la API viven en
// hostnames distintos: `document.cookie` no puede leer la cookie XSRF-TOKEN
// emitida por la API porque queda asociada al dominio de la API. El backend
// devuelve `csrfToken` en el body de /auth/login y /auth/mfa/verify para que el
// cliente lo cachee y lo reenvíe en el header X-XSRF-TOKEN.
//
// Vive en su propio módulo (sin dependencias del sistema de mocks) para que lo
// puedan importar tanto el http-client como llamadas multipart (subida de
// imágenes) sin arrastrar el router de mocks.

const STORAGE_KEY_CSRF = "nexott.csrf"

let csrfTokenEnMemoria: string | null = null

function leerTokenSessionStorage(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    return window.sessionStorage.getItem(STORAGE_KEY_CSRF)
  } catch {
    return null
  }
}

function guardarTokenSessionStorage(token: string | null): void {
  if (typeof window === "undefined") {
    return
  }
  try {
    if (token === null) {
      window.sessionStorage.removeItem(STORAGE_KEY_CSRF)
      return
    }
    window.sessionStorage.setItem(STORAGE_KEY_CSRF, token)
  } catch {
    // sessionStorage puede estar deshabilitado (modo privado estricto) — el
    // token en memoria sigue funcionando durante la vida del bundle.
  }
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

export function setCsrfToken(token: string | null): void {
  csrfTokenEnMemoria = token
  guardarTokenSessionStorage(token)
}

export function obtenerCsrfToken(): string | null {
  if (csrfTokenEnMemoria !== null) {
    return csrfTokenEnMemoria
  }
  const persistido = leerTokenSessionStorage()
  if (persistido !== null) {
    csrfTokenEnMemoria = persistido
    return persistido
  }
  return readCookie("XSRF-TOKEN")
}
