import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "nexott:participante:sidebar-colapsado"

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
    // localStorage inaccesible — la preferencia se pierde
  }
}

interface UseSidebarColapsadoParticipanteResult {
  readonly colapsado: boolean
  readonly alternar: () => void
}

export function useSidebarColapsadoParticipante(): UseSidebarColapsadoParticipanteResult {
  const [colapsado, setColapsado] = useState<boolean>(leerPreferencia)

  const alternar = useCallback(() => {
    setColapsado((previo) => {
      const siguiente = !previo
      escribirPreferencia(siguiente)
      return siguiente
    })
  }, [])

  // Atajo global `[` para alternar el sidebar (doc 02_mi_bandeja §2.3).
  // Se ignora si el foco está en un campo editable.
  useEffect(() => {
    function manejar(evento: KeyboardEvent) {
      if (evento.key !== "[") {
        return
      }
      if (evento.metaKey || evento.ctrlKey || evento.altKey) {
        return
      }
      const objetivo = evento.target as HTMLElement | null
      if (
        objetivo &&
        (objetivo.tagName === "INPUT" ||
          objetivo.tagName === "TEXTAREA" ||
          objetivo.isContentEditable)
      ) {
        return
      }
      evento.preventDefault()
      alternar()
    }
    window.addEventListener("keydown", manejar)
    return () => window.removeEventListener("keydown", manejar)
  }, [alternar])

  return { colapsado, alternar }
}
