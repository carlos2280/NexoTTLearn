import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "nexott-inmersivo-sidebar-colapsado"

function leerEstado(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

function subscribir(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => window.removeEventListener("storage", onStorage)
}

interface UseSidebarColapsadoResult {
  readonly colapsado: boolean
  readonly toggle: () => void
}

/**
 * Estado del sidebar del inmersivo (expandido / colapsado), persistido en
 * localStorage para que el colaborador no pierda su preferencia entre
 * sesiones. Sincronizado entre pestañas via StorageEvent.
 */
export function useSidebarColapsado(): UseSidebarColapsadoResult {
  const colapsado = useSyncExternalStore(subscribir, leerEstado, () => false)

  const toggle = useCallback(() => {
    const siguiente = !leerEstado()
    const valor = siguiente ? "1" : "0"
    window.localStorage.setItem(STORAGE_KEY, valor)
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: valor }))
  }, [])

  return { colapsado, toggle }
}
