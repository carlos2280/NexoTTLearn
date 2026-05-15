import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from "@radix-ui/react-popover"
import { Plus, Search } from "lucide-react"
import { type ReactNode, useState } from "react"

interface SelectorPopoverProps<T> {
  readonly disponibles: readonly T[]
  readonly obtenerId: (item: T) => string
  readonly obtenerEtiqueta: (item: T) => string
  readonly renderItem: (item: T) => ReactNode
  readonly onSeleccionar: (id: string) => void
  readonly triggerLabel: string
  readonly buscable?: boolean
  readonly placeholderBusqueda?: string
  readonly emptyMessage?: string
  readonly disabled?: boolean
}

/**
 * SelectorPopover — reemplaza al `<select>` nativo con un popover NexoTT
 * elegante. Lista vertical de opciones, opcionalmente con input de búsqueda.
 *
 * Cada opción se renderiza con `renderItem` (libre — typically un chip o un
 * bloque con color + etiqueta).
 */
export function SelectorPopover<T>({
  disponibles,
  obtenerId,
  obtenerEtiqueta,
  renderItem,
  onSeleccionar,
  triggerLabel,
  buscable = false,
  placeholderBusqueda = "Buscar…",
  emptyMessage = "Sin opciones",
  disabled,
}: SelectorPopoverProps<T>) {
  const [abierto, setAbierto] = useState(false)
  const [query, setQuery] = useState("")

  const filtrados =
    buscable && query.trim().length > 0
      ? disponibles.filter((d) =>
          obtenerEtiqueta(d).toLowerCase().includes(query.trim().toLowerCase()),
        )
      : disponibles

  function manejarSeleccion(id: string) {
    onSeleccionar(id)
    setAbierto(false)
    setQuery("")
  }

  const deshabilitado = disabled || disponibles.length === 0

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild={true}>
        <button
          type="button"
          disabled={deshabilitado}
          className="hover:-translate-y-0.5 inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-border-strong bg-surface px-3 py-1.5 font-medium text-body-sm text-text-secondary shadow-xs transition-[transform,border-color,box-shadow,color] duration-base ease-default hover:border-aurora-violet/40 hover:text-text-primary hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-border-strong disabled:hover:text-text-secondary disabled:hover:shadow-xs"
        >
          <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
          {triggerLabel}
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 z-popover w-[320px] overflow-hidden rounded-xl border border-border bg-surface shadow-overlay data-[state=closed]:animate-out data-[state=open]:animate-in"
        >
          {buscable ? (
            <div className="flex items-center gap-2 border-border border-b px-3 py-2">
              <Search
                className="h-4 w-4 shrink-0 text-text-tertiary"
                strokeWidth={1.5}
                aria-hidden={true}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholderBusqueda}
                aria-label="Buscar"
                className="flex-1 bg-transparent text-body-sm text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </div>
          ) : null}
          <ul className="max-h-[280px] overflow-y-auto p-1">
            {filtrados.length === 0 ? (
              <li className="px-3 py-2 text-body-sm text-text-tertiary">{emptyMessage}</li>
            ) : (
              filtrados.map((item) => (
                <li key={obtenerId(item)}>
                  <button
                    type="button"
                    onClick={() => manejarSeleccion(obtenerId(item))}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm transition-colors duration-fast ease-default hover:bg-subtle"
                  >
                    {renderItem(item)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}
