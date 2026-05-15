import { Kbd } from "@/shared/components/ui/kbd"
import { cn } from "@/shared/lib/cn"
import type { TipoBloque } from "@nexott-learn/shared-types"
import { useEffect, useRef, useState } from "react"
import { tipoBloqueMeta, tiposBloqueOrdenados } from "../../bloque-tipo-meta"

interface PosicionCursor {
  readonly left: number
  readonly top: number
}

interface SlashMenuProps {
  readonly filtro: string
  readonly posicion: PosicionCursor
  readonly onElegir: (tipo: TipoBloque) => void
  readonly onCerrar: () => void
}

/**
 * Menú flotante de tipos de bloque al estilo Notion. Anclado al contenedor
 * relativo del editor padre (usa `absolute`). Navegable con ↑/↓/Enter + Esc.
 */
export function SlashMenu({ filtro, posicion, onElegir, onCerrar }: SlashMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const f = filtro.trim().toLowerCase()
  const tipos = tiposBloqueOrdenados().filter((t) => {
    if (!f) {
      return true
    }
    const meta = tipoBloqueMeta(t)
    return meta.etiqueta.toLowerCase().includes(f)
  })
  const [indiceActivo, setIndiceActivo] = useState(0)

  // Reiniciar al cambiar el filtro
  // biome-ignore lint/correctness/useExhaustiveDependencies: filtro es el disparador del reset aunque no se use en el cuerpo del effect
  useEffect(() => {
    setIndiceActivo(0)
  }, [filtro])

  // Navegación con teclado
  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: menú slash con navegación teclado + filtrado + posicionamiento — complejidad intrínseca del componente
    function onKey(e: KeyboardEvent) {
      if (tipos.length === 0) {
        if (e.key === "Escape") {
          onCerrar()
        }
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setIndiceActivo((i) => (i + 1) % tipos.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setIndiceActivo((i) => (i - 1 + tipos.length) % tipos.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        const tipo = tipos[indiceActivo]
        if (tipo) {
          onElegir(tipo)
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onCerrar()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [tipos, indiceActivo, onElegir, onCerrar])

  // Click fuera cierra
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const node = containerRef.current
      if (node && !node.contains(e.target as Node)) {
        onCerrar()
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [onCerrar])

  // Posicionamiento: pegado al cursor, evitando salirse por la derecha/abajo
  const anchoMenu = 288
  const left = Math.min(
    posicion.left,
    typeof window !== "undefined" ? window.innerWidth - anchoMenu - 16 : posicion.left,
  )
  const top = posicion.top + 6

  if (tipos.length === 0) {
    return (
      <div
        ref={containerRef}
        // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA listbox flotante — no hay equivalente nativo con <select> para menús flotantes custom
        role="listbox"
        tabIndex={-1}
        style={{ position: "fixed", left, top, width: anchoMenu }}
        className="z-overlay rounded-xl border border-border bg-surface px-4 py-3 text-body-sm text-text-tertiary shadow-overlay"
      >
        Sin resultados para «{filtro}».
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA listbox flotante — no hay equivalente nativo con <select> para menús flotantes custom
      role="listbox"
      tabIndex={-1}
      style={{ position: "fixed", left, top, width: anchoMenu }}
      className="z-overlay overflow-hidden rounded-xl border border-border bg-surface shadow-overlay"
    >
      <ul className="max-h-72 overflow-y-auto p-1">
        {tipos.map((t, idx) => {
          const meta = tipoBloqueMeta(t)
          const Icono = meta.icono
          const activo = idx === indiceActivo
          return (
            <li key={t}>
              <button
                type="button"
                // biome-ignore lint/a11y/useSemanticElements: button[role="option"] en listbox custom — <option> solo aplica en <select>
                role="option"
                aria-selected={activo}
                onMouseEnter={() => setIndiceActivo(idx)}
                onClick={() => onElegir(t)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left",
                  "transition-[background-color,color,box-shadow] duration-fast ease-default",
                  activo ? "bg-subtle shadow-xs" : "hover:bg-subtle/60",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    activo ? "bg-accent-soft text-accent" : "bg-subtle text-text-tertiary",
                  )}
                >
                  <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium text-body-sm text-text-primary">
                    {meta.etiqueta}
                  </span>
                  <span className="truncate text-caption text-text-tertiary">
                    {meta.descripcionCorta}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between gap-2 border-border border-t bg-subtle/40 px-3 py-2 font-mono text-caption text-text-tertiary">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <span>navegar</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          <span>elegir</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>esc</Kbd>
          <span>cerrar</span>
        </span>
      </div>
    </div>
  )
}
