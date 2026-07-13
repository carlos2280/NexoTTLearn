import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "nexott-inmersivo-panel-avance-abierto"

function leerEstado(): boolean {
  if (typeof window === "undefined") {
    return true
  }
  // Abierto por defecto: solo el valor explícito "0" lo deja colapsado.
  return window.localStorage.getItem(STORAGE_KEY) !== "0"
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

interface UsePanelAvanceResult {
  readonly abierto: boolean
  readonly toggle: () => void
}

/**
 * Estado del panel inferior de avance del inmersivo (abierto / colapsado),
 * persistido en localStorage para respetar la preferencia del colaborador entre
 * sesiones. Sincronizado entre pestañas via StorageEvent. Default: abierto.
 */
export function usePanelAvance(): UsePanelAvanceResult {
  const abierto = useSyncExternalStore(subscribir, leerEstado, () => true)

  const toggle = useCallback(() => {
    const siguiente = !leerEstado()
    const valor = siguiente ? "1" : "0"
    window.localStorage.setItem(STORAGE_KEY, valor)
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: valor }))
  }, [])

  return { abierto, toggle }
}
