import { cn } from "@/shared/lib/cn"
import { ChevronDown } from "lucide-react"
import { type ReactNode, useState } from "react"

interface InspectorPanelProps {
  readonly eyebrow?: string
  readonly title: string
  readonly subtitle?: ReactNode
  readonly children: ReactNode
}

/**
 * Contenedor estándar del inspector. Encabezado fijo arriba + cuerpo
 * scrollable. Mantiene paddings y tipografía consistentes entre los 8
 * modos del editor admin y el inspector del participante.
 */
export function InspectorPanel({ eyebrow, title, subtitle, children }: InspectorPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-glass-border border-b px-5 pt-5 pb-4">
        {eyebrow ? (
          <p className="mb-1 font-semibold text-[11px] text-text-muted uppercase tracking-[0.12em]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-semibold text-[15px] text-text-primary">{title}</h2>
        {subtitle ? <div className="mt-1 text-text-secondary text-xs">{subtitle}</div> : null}
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-5">{children}</div>
      </div>
    </div>
  )
}

interface InspectorSectionProps {
  readonly title: string
  readonly defaultOpen?: boolean
  readonly children: ReactNode
}

export function InspectorSection({ title, defaultOpen = true, children }: InspectorSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between font-semibold text-[11px] uppercase tracking-[0.12em]",
          "text-text-muted hover:text-text-secondary",
        )}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open ? "" : "-rotate-90")}
          strokeWidth={2}
        />
      </button>
      {open ? <div className="flex flex-col gap-3">{children}</div> : null}
    </section>
  )
}

interface InspectorRowProps {
  readonly label: string
  readonly hint?: string
  readonly children: ReactNode
}

export function InspectorRow({ label, hint, children }: InspectorRowProps) {
  // No usamos <label htmlFor> porque InspectorRow envuelve composiciones
  // arbitrarias (toggles, grids de botones, varios inputs). El acoplamiento
  // a11y se delega al input concreto que viva como `children`.
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-text-secondary text-xs">{label}</span>
      {children}
      {hint ? <p className="text-[11px] text-text-muted">{hint}</p> : null}
    </div>
  )
}
