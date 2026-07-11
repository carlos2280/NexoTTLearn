import { cn } from "@/shared/lib/cn"
import type { LucideIcon } from "lucide-react"

export interface BotonProps {
  readonly icono: LucideIcon
  readonly etiqueta: string
  readonly activo?: boolean
  readonly deshabilitado?: boolean
  readonly onClick: () => void
}

/** Botón icónico de la toolbar de TipTap (compartido entre la toolbar y sus extensiones). */
export function Boton({ icono: Icono, etiqueta, activo, deshabilitado, onClick }: BotonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md",
        "transition-[background-color,color,box-shadow] duration-fast ease-default",
        "disabled:cursor-not-allowed disabled:opacity-40",
        activo
          ? "bg-subtle text-text-primary shadow-xs"
          : "text-text-secondary hover:bg-subtle/60 hover:text-text-primary",
      )}
    >
      <Icono
        className={cn("h-4 w-4", activo ? "text-accent" : "")}
        strokeWidth={1.5}
        aria-hidden={true}
      />
    </button>
  )
}

export function Separador() {
  return <span aria-hidden={true} className="mx-1 h-5 w-px bg-border" />
}
