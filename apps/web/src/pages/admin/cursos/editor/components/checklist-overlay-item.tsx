import { cn } from "@/shared/lib/cn"
import type { ChecklistCtaTarget, ChecklistItemResult } from "@nexott-learn/shared-types"
import { ArrowRight } from "lucide-react"

interface ChecklistOverlayItemProps {
  readonly item: ChecklistItemResult
  readonly onGoTo?: (target: ChecklistCtaTarget) => void
}

export function ChecklistOverlayItem({ item, onGoTo }: ChecklistOverlayItemProps) {
  const cta = !item.cumplido && item.ctaTarget && onGoTo ? item.ctaTarget : null
  return (
    <li
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-2",
        item.cumplido ? "text-text-muted" : "bg-glass-1 text-text-secondary",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-text-primary">{item.label}</p>
        {item.detalle ? <p className="mt-0.5 text-text-muted text-xs">{item.detalle}</p> : null}
      </div>
      {cta ? (
        <button
          type="button"
          onClick={() => onGoTo?.(cta)}
          className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 font-semibold text-[11px] text-brand-violet-soft uppercase tracking-wider hover:bg-glass-2 hover:text-brand-violet"
        >
          Ir a corregir
          <ArrowRight className="size-3" strokeWidth={2} />
        </button>
      ) : null}
    </li>
  )
}
