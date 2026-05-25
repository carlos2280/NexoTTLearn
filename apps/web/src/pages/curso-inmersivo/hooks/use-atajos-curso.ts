import type { CursoArbolModulo } from "@nexott-learn/shared-types"
import { useEffect, useMemo } from "react"

interface UseAtajosCursoInput {
  readonly arbol: readonly CursoArbolModulo[]
  readonly seccionActivaId: string | null
  readonly onSeleccionar: (seccionId: string) => void
  readonly onSalir: () => void
  readonly onToggleSidebar: () => void
}

const TAGS_INPUT = new Set(["INPUT", "TEXTAREA", "SELECT"])

/**
 * Atajos de teclado del modo inmersivo:
 *  - `[` → sección anterior del plan (recorre módulos en orden).
 *  - `]` → sección siguiente del plan.
 *  - `\` → mostrar/ocultar el sidebar.
 *  - `Esc` → volver a la bandeja.
 *
 * Ignoramos eventos cuando el foco está en un input/textarea/select o cuando
 * un quiz/editor de código está usando el teclado para escribir.
 */
export function useAtajosCurso(input: UseAtajosCursoInput): void {
  const { arbol, seccionActivaId, onSeleccionar, onSalir, onToggleSidebar } = input

  const seccionesEnOrden = useMemo(() => {
    return arbol.flatMap((m) => m.secciones.map((s) => s.seccionId))
  }, [arbol])

  useEffect(() => {
    function handleKey(event: KeyboardEvent): void {
      if (debeIgnorarse(event)) {
        return
      }
      const accion = MAPA_ACCIONES.get(event.key)
      if (!accion) {
        return
      }
      event.preventDefault()
      if (accion === "salir") {
        onSalir()
        return
      }
      if (accion === "toggleSidebar") {
        onToggleSidebar()
        return
      }
      const delta = accion === "anterior" ? -1 : 1
      navegar(delta, seccionesEnOrden, seccionActivaId, onSeleccionar)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [seccionesEnOrden, seccionActivaId, onSeleccionar, onSalir, onToggleSidebar])
}

type Accion = "anterior" | "siguiente" | "salir" | "toggleSidebar"
const MAPA_ACCIONES: ReadonlyMap<string, Accion> = new Map([
  ["[", "anterior"],
  ["]", "siguiente"],
  ["\\", "toggleSidebar"],
  ["Escape", "salir"],
])

function debeIgnorarse(event: KeyboardEvent): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return true
  }
  const target = event.target as HTMLElement | null
  if (!target) {
    return false
  }
  return TAGS_INPUT.has(target.tagName) || target.isContentEditable
}

function navegar(
  delta: number,
  orden: readonly string[],
  activaId: string | null,
  onSeleccionar: (seccionId: string) => void,
): void {
  if (orden.length === 0) {
    return
  }
  const idx = activaId ? orden.indexOf(activaId) : -1
  const siguiente = idx === -1 ? 0 : Math.min(Math.max(idx + delta, 0), orden.length - 1)
  const id = orden[siguiente]
  if (id && id !== activaId) {
    onSeleccionar(id)
  }
}
