import { cn } from "@/shared/lib/cn"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly onCambiarPage: (page: number) => void
  readonly className?: string
}

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
        "flex items-center justify-between gap-3 px-1 pt-3 text-caption text-text-secondary",
        className,
      )}
    >
      <span className="tabular">
        {total === 0
          ? "Sin resultados"
          : `${inicio.toLocaleString("es-ES")}–${fin.toLocaleString("es-ES")} de ${total.toLocaleString("es-ES")}`}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onCambiarPage(page - 1)}
          disabled={!hayAnterior}
          aria-label="Página anterior"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition-colors duration-fast ease-default hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
        </button>
        <span className="tabular px-2 text-text-tertiary">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onCambiarPage(page + 1)}
          disabled={!haySiguiente}
          aria-label="Página siguiente"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition-colors duration-fast ease-default hover:border-border-strong hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
        </button>
      </div>
    </nav>
  )
}
