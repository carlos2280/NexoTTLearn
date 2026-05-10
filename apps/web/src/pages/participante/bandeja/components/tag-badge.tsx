import type { PendienteTag } from "@nexott-learn/shared-types"

interface TagBadgeProps {
  readonly tag: PendienteTag
}

export function TagBadge({ tag }: TagBadgeProps) {
  switch (tag) {
    case "URGENTE":
      return (
        <span className="rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 font-medium text-[11px] text-danger">
          Urgente
        </span>
      )
    case "RETOMAR":
      return (
        <span className="rounded-full border border-brand-violet/25 bg-brand-violet/10 px-2.5 py-0.5 font-medium text-[11px] text-brand-violet-soft">
          Retomar
        </span>
      )
    case "PENDIENTE":
      return (
        <span className="rounded-full border border-glass-border bg-surface-2 px-2.5 py-0.5 font-medium text-[11px] text-text-muted">
          Pendiente
        </span>
      )
    default: {
      const _exhaustive: never = tag
      return _exhaustive
    }
  }
}
