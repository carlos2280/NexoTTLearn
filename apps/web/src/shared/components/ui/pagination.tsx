import { cn } from "@/shared/lib/cn"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly onCambiarPage: (page: number) => void
  readonly className?: string
}

/**
 * Pagination NexoTT.
 *
 * Identidad: tipografía mono en contadores, botones generosos con micro-shadow
 * resting + hover lift, focus halo aurora. Sin botones diminutos tipo Bootstrap.
 */
export function Pagination({ page, pageSize, total, onCambiarPage, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const haySiguiente = page < totalPages
  const hayAnterior = page > 1
  const inicio = total === 0 ? 0 : (page - 1) * pageSize + 1
  const fin = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        "flex items-center justify-between gap-3 px-1 pt-3",
        "font-mono text-caption text-text-tertiary",
        className,
      )}
    >
      <span className="tabular">
        {total === 0
          ? "Sin resultados"
          : `${inicio.toLocaleString("es-ES")}–${fin.toLocaleString("es-ES")} de ${total.toLocaleString("es-ES")}`}
      </span>
      <div className="flex items-center gap-2">
        <PagBoton
          direccion="anterior"
          disabled={!hayAnterior}
          onClick={() => onCambiarPage(page - 1)}
        />
        <span className="tabular px-1 text-text-secondary">
          <span className="text-text-primary">{page}</span>
          <span className="px-1 text-text-tertiary">/</span>
          <span>{totalPages}</span>
        </span>
        <PagBoton
          direccion="siguiente"
          disabled={!haySiguiente}
          onClick={() => onCambiarPage(page + 1)}
        />
      </div>
    </nav>
  )
}

interface PagBotonProps {
  readonly direccion: "anterior" | "siguiente"
  readonly disabled: boolean
  readonly onClick: () => void
}

function PagBoton({ direccion, disabled, onClick }: PagBotonProps) {
  const Icon = direccion === "anterior" ? ChevronLeft : ChevronRight
  const aria = direccion === "anterior" ? "Página anterior" : "Página siguiente"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl",
        "border border-border bg-surface text-text-secondary shadow-xs",
        "transition-[border-color,box-shadow,transform,color] duration-base ease-default",
        "hover:-translate-y-px hover:border-border-strong hover:text-text-primary hover:shadow-sm",
        "focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-xs",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
    </button>
  )
}
