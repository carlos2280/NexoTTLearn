import { cn } from "@/shared/lib/cn"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

export interface BreadcrumbItem {
  readonly id: string
  readonly label: string
  readonly icon?: ReactNode
  /** Si null/undefined, el segmento se muestra como current (sin botón). */
  readonly onClick?: () => void
}

interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[]
}

/**
 * Barra de navegación contextual para el canvas inmersivo. Renderiza el
 * camino jerárquico (Curso › Área › Módulo › Sección) con segmentos
 * clicables hasta el penúltimo; el último es la posición actual y se
 * destaca sin acción. Genérica: el consumidor mapea su modelo al shape
 * BreadcrumbItem.
 */
export function ImmersiveBreadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) {
    return null
  }
  const lastIndex = items.length - 1
  const trailKey = items.map((it) => it.id).join("|")

  return (
    <motion.nav
      key={trailKey}
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      aria-label="Ruta de navegación"
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 overflow-x-auto",
        "border-glass-border border-b bg-surface-1/40 px-6",
        "text-sm",
      )}
    >
      {items.map((item, index) => {
        const isLast = index === lastIndex
        return (
          <div key={item.id} className="flex shrink-0 items-center gap-1">
            {index > 0 ? (
              <ChevronRight
                className="size-3 shrink-0 text-text-faint"
                strokeWidth={2}
                aria-hidden="true"
              />
            ) : null}
            <BreadcrumbSegment item={item} isLast={isLast} />
          </div>
        )
      })}
    </motion.nav>
  )
}

interface SegmentProps {
  readonly item: BreadcrumbItem
  readonly isLast: boolean
}

function BreadcrumbSegment({ item, isLast }: SegmentProps) {
  const content = (
    <>
      {item.icon ? (
        <span
          className={cn("shrink-0", isLast ? "text-text-primary" : "text-text-muted")}
          aria-hidden="true"
        >
          {item.icon}
        </span>
      ) : null}
      <span className="truncate">{item.label}</span>
    </>
  )

  if (isLast || !item.onClick) {
    return (
      <span
        aria-current={isLast ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-1",
          isLast ? "font-medium text-text-primary" : "text-text-secondary",
        )}
      >
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-1",
        "text-text-secondary transition-colors duration-150",
        "hover:bg-glass-2 hover:text-text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40",
      )}
    >
      {content}
    </button>
  )
}
