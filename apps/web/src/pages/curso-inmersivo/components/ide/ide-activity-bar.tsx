import { cn } from "@/shared/lib/cn"
import { ListTree } from "lucide-react"

interface IdeActivityBarProps {
  /** El sidebar del plan está oculto. El riel siempre se ve; refleja el estado. */
  readonly sidebarColapsado: boolean
  readonly onTogglePlan: () => void
  readonly atenuado?: boolean
}

/**
 * Riel de actividad del IDE inmerso (borde izquierdo, patrón VS Code). Siempre
 * visible; hospeda los "lugares" del curso. Hoy solo el Plan — al crecer la
 * carcasa (búsqueda, archivos, git) se suman íconos aquí. Reemplaza al botón
 * flotante de reabrir: el toggle vive permanentemente en el riel.
 */
export function IdeActivityBar({ sidebarColapsado, onTogglePlan, atenuado }: IdeActivityBarProps) {
  return (
    <nav
      aria-label="Actividad del curso"
      className={cn(
        "flex w-12 shrink-0 flex-col items-center gap-1 border-border border-r bg-subtle py-2.5",
        "transition-[opacity,filter] duration-cinematic ease-default",
        atenuado ? "pointer-events-none opacity-15 blur-[2px]" : "",
      )}
    >
      <BotonActividad
        activo={!sidebarColapsado}
        onClick={onTogglePlan}
        etiqueta="Plan del curso"
        icono={ListTree}
      />
    </nav>
  )
}

interface BotonActividadProps {
  readonly activo: boolean
  readonly onClick: () => void
  readonly etiqueta: string
  readonly icono: typeof ListTree
}

function BotonActividad({ activo, onClick, etiqueta, icono: Icono }: BotonActividadProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      title={`${etiqueta} (\\)`}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md",
        "cursor-pointer transition-colors duration-base ease-default",
        activo ? "text-accent" : "text-text-tertiary hover:text-text-secondary",
      )}
    >
      {activo ? (
        <span
          aria-hidden={true}
          className="-translate-y-1/2 absolute top-1/2 left-[-10px] h-5 w-0.5 rounded-pill bg-accent"
        />
      ) : null}
      <Icono className="h-[18px] w-[18px]" aria-hidden={true} />
    </button>
  )
}
