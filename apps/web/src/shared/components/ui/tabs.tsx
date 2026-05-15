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

/**
 * Tabs — navegación entre vistas dentro de una pantalla.
 *
 * Identidad NexoTT:
 * - Underline activa con gradient aurora sutil (firma de marca discreta).
 * - Hover: preview de underline en text-tertiary (1px fantasma).
 * - Padding generoso, transición suave.
 * - Contadores en pill con tipografía mono.
 */
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
      {items.map((item) => (
        <Tab
          key={item.id}
          item={item}
          esActiva={item.id === activa}
          onSeleccionar={() => onCambiar(item.id)}
        />
      ))}
    </div>
  )
}

interface TabProps<TId extends string> {
  readonly item: TabItem<TId>
  readonly esActiva: boolean
  readonly onSeleccionar: () => void
}

function Tab<TId extends string>({ item, esActiva, onSeleccionar }: TabProps<TId>) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={esActiva}
      tabIndex={esActiva ? 0 : -1}
      onClick={onSeleccionar}
      className={cn(
        "group relative inline-flex cursor-pointer items-center gap-2 px-4 py-3 text-body-sm",
        "transition-colors duration-base ease-default",
        "focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        esActiva ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
      )}
    >
      <span className="font-medium">{item.etiqueta}</span>
      {item.contador !== undefined ? (
        <TabContador valor={item.contador} esActiva={esActiva} />
      ) : null}

      {/* Underline aurora — solo en activa. Posición absoluta para alinear con el border-b padre. */}
      {esActiva ? (
        <span
          aria-hidden={true}
          className="-bottom-px absolute right-0 left-0 h-[2px] rounded-pill bg-[image:var(--gradient-aurora)]"
        />
      ) : (
        <span
          aria-hidden={true}
          className="-bottom-px absolute right-3 left-3 h-[2px] origin-center scale-x-0 rounded-pill bg-border-strong opacity-0 transition-all duration-base ease-default group-hover:scale-x-100 group-hover:opacity-100"
        />
      )}
    </button>
  )
}

function TabContador({ valor, esActiva }: { readonly valor: number; readonly esActiva: boolean }) {
  return (
    <span
      className={cn(
        "tabular inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5",
        "font-mono text-[11px] transition-colors duration-base ease-default",
        esActiva ? "bg-accent-soft text-accent-on-soft" : "bg-subtle text-text-tertiary",
      )}
    >
      {valor}
    </span>
  )
}
