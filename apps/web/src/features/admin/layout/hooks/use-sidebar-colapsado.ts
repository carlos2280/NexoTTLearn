import { useCallback, useState } from "react"

const STORAGE_KEY = "nexott:admin:sidebar-colapsado"

function leerPreferencia(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

function escribirPreferencia(valor: boolean): void {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, String(valor))
  } catch {
    // localStorage inaccesible (modo privado, etc.) — la preferencia se pierde
  }
}

interface UseSidebarColapsadoResult {
  readonly colapsado: boolean
  readonly alternar: () => void
}

export function useSidebarColapsado(): UseSidebarColapsadoResult {
  const [colapsado, setColapsado] = useState<boolean>(leerPreferencia)

  const alternar = useCallback(() => {
    setColapsado((previo) => {
      const siguiente = !previo
      escribirPreferencia(siguiente)
      return siguiente
    })
  }, [])

  return { colapsado, alternar }
}
