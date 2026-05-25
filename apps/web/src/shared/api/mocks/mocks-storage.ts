/**
 * Persistencia ligera para mocks: snapshot en localStorage por clave.
 * Permite que los datos creados en modo mock sobrevivan a refresh sin tocar
 * el flujo de hooks/Tanstack Query.
 *
 * Patron: el handler mantiene `db` en memoria (rendimiento) y la persistencia
 * se delega via `persistir(clave, data)` en cada mutacion.
 */

const PREFIJO = "nexott-mock:"

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function cargarSnapshot<T>(clave: string, fallback: T[]): T[] {
  if (!isBrowser()) {
    return [...fallback]
  }
  try {
    const raw = window.localStorage.getItem(`${PREFIJO}${clave}`)
    if (!raw) {
      return [...fallback]
    }
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed as T[]
    }
    return [...fallback]
  } catch {
    return [...fallback]
  }
}

export function guardarSnapshot<T>(clave: string, data: readonly T[]): void {
  if (!isBrowser()) {
    return
  }
  try {
    window.localStorage.setItem(`${PREFIJO}${clave}`, JSON.stringify(data))
  } catch {
    // localStorage lleno o deshabilitado: ignorar silenciosamente en modo mock.
  }
}

export function limpiarSnapshot(clave: string): void {
  if (!isBrowser()) {
    return
  }
  try {
    window.localStorage.removeItem(`${PREFIJO}${clave}`)
  } catch {
    // ignorar
  }
}
