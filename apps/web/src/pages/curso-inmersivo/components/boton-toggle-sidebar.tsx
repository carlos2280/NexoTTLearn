import { cn } from "@/shared/lib/cn"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

interface BotonToggleSidebarProps {
  readonly colapsado: boolean
  readonly onToggle: () => void
  /**
   * `inline` se usa en la cabecera del sidebar expandido (sin borde, sin
   * sombra, solo cambio de fondo en hover). `flotante` se usa cuando el
   * sidebar está oculto: aparece sobre el canvas con sombra suave.
   */
  readonly variante: "inline" | "flotante"
}

interface BotonReabrirFlotanteProps {
  readonly visible: boolean
  readonly onToggle: () => void
}

/**
 * Wrapper posicionado del botón flotante para reabrir el sidebar. Se renderiza
 * sobre el canvas en la esquina superior izquierda cuando el sidebar está
 * oculto y no estamos en modo focus. Recibir `visible` ya resuelto evita
 * inflar la complejidad cognitiva del layout de la página.
 */
export function BotonReabrirFlotante({ visible, onToggle }: BotonReabrirFlotanteProps) {
  if (!visible) {
    return null
  }
  return (
    <div className="pointer-events-none absolute top-4 left-3 z-10">
      <div className="pointer-events-auto">
        <BotonToggleSidebar colapsado={true} onToggle={onToggle} variante="flotante" />
      </div>
    </div>
  )
}

/**
 * Botón discreto para alternar entre sidebar expandido y oculto en el modo
 * inmersivo. Reutilizado en dos lugares: cabecera del sidebar (inline) y
 * borde izquierdo del canvas cuando el sidebar está colapsado (flotante).
 */
export function BotonToggleSidebar({ colapsado, onToggle, variante }: BotonToggleSidebarProps) {
  const Icono = colapsado ? PanelLeftOpen : PanelLeftClose
  const etiqueta = colapsado ? "Mostrar plan del curso" : "Ocultar plan del curso"
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={etiqueta}
      aria-expanded={!colapsado}
      title={`${etiqueta} (\\)`}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary",
        "cursor-pointer transition-[background-color,color,box-shadow,transform] duration-base ease-default",
        "hover:bg-muted hover:text-text-primary",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        variante === "flotante" &&
          "hover:-translate-y-0.5 border border-border bg-surface text-text-secondary shadow-sm hover:shadow-md",
      )}
    >
      <Icono className="h-4 w-4" aria-hidden={true} />
    </button>
  )
}
