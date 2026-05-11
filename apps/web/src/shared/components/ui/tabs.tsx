import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

export interface TabItem<TId extends string = string> {
  readonly id: TId
  readonly etiqueta: ReactNode
  readonly contador?: number
}

interface TabsProps<TId extends string> {
  readonly items: readonly TabItem<TId>[]
  readonly activa: TId
  readonly onCambiar: (id: TId) => void
  readonly className?: string
  readonly etiquetaAria?: string
}

export function Tabs<TId extends string>({
  items,
  activa,
  onCambiar,
  className,
  etiquetaAria,
}: TabsProps<TId>) {
  return (
    <div
      role="tablist"
      aria-label={etiquetaAria}
      className={cn("flex items-center gap-1 border-border border-b", className)}
    >
      {items.map((item) => {
        const esActiva = item.id === activa
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={esActiva}
            tabIndex={esActiva ? 0 : -1}
            onClick={() => onCambiar(item.id)}
            className={cn(
              "-mb-px relative inline-flex items-center gap-2 border-b-2 px-3 pt-2 pb-2.5",
              "text-body-sm transition-colors duration-fast ease-default",
              "focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
              esActiva
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            <span>{item.etiqueta}</span>
            {item.contador !== undefined ? (
              <span
                className={cn(
                  "tabular inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-caption",
                  esActiva ? "bg-accent-soft text-accent-on-soft" : "bg-subtle text-text-tertiary",
                )}
              >
                {item.contador}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
