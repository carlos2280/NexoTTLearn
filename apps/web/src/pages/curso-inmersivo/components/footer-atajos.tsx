import { Kbd } from "@/shared/components/ui/kbd"

/**
 * Pie del sidebar con los atajos de teclado del curso inmersivo. Sin estado
 * propio, sin props — solo presentacion.
 */
export function FooterAtajos() {
  return (
    <footer className="flex items-center justify-between gap-2 border-border border-t bg-canvas/40 px-5 py-3">
      <div className="flex items-center gap-2">
        <Kbd>[</Kbd>
        <Kbd>]</Kbd>
        <span className="text-caption text-text-tertiary">navegar</span>
      </div>
      <div className="flex items-center gap-2">
        <Kbd>Esc</Kbd>
        <span className="text-caption text-text-tertiary">salir</span>
      </div>
    </footer>
  )
}
