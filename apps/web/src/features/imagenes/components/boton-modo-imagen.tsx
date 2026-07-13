import { cn } from "@/shared/lib/cn"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface BotonModoImagenProps {
  readonly activo: boolean
  readonly onClick: () => void
  readonly icono: LucideIcon
  readonly children: ReactNode
}

/** Pestaña del selector de modo (subir archivo / pegar URL) del diálogo de imagen. */
export function BotonModoImagen({ activo, onClick, icono: Icono, children }: BotonModoImagenProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm transition-colors duration-fast ease-default",
        activo
          ? "bg-surface text-text-primary shadow-xs"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
      {children}
    </button>
  )
}
