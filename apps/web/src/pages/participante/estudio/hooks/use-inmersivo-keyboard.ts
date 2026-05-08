import { useEffect } from "react"

interface Options {
  readonly onSalir: () => void
  readonly onSiguiente: () => void
  readonly onAnterior: () => void
}

// Atajos de teclado del modo inmersivo (S1 minimo · README.md §8):
// - Esc: sale del modo inmersivo (jerarquia completa cueva→ide→salida en S5).
// - Cmd+→ / Ctrl+→: siguiente bloque.
// - Cmd+← / Ctrl+←: bloque anterior.

export function useInmersivoKeyboard({ onSalir, onSiguiente, onAnterior }: Options): void {
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (esEscribiendo(event.target)) {
        return
      }
      if (event.key === "Escape") {
        event.preventDefault()
        onSalir()
        return
      }
      const accion = mapearAtajo(event)
      if (accion === "siguiente") {
        event.preventDefault()
        onSiguiente()
      } else if (accion === "anterior") {
        event.preventDefault()
        onAnterior()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onSalir, onSiguiente, onAnterior])
}

type AtajoNavegacion = "siguiente" | "anterior" | null

function mapearAtajo(event: KeyboardEvent): AtajoNavegacion {
  if (!(event.metaKey || event.ctrlKey)) {
    return null
  }
  if (event.key === "ArrowRight") {
    return "siguiente"
  }
  if (event.key === "ArrowLeft") {
    return "anterior"
  }
  return null
}

function esEscribiendo(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable
}
