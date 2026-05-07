import { cn } from "@/shared/lib/cn"
import { Check, Loader2 } from "lucide-react"
import { type SaveStatus, formatRelativeFromNow } from "../hooks/use-save-status"

interface SaveIndicatorProps {
  readonly status: SaveStatus
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status.tipo === "guardando") {
    return (
      <span className="hidden items-center gap-1.5 text-[11px] text-text-muted lg:flex">
        <Loader2 className="size-3 animate-spin text-brand-violet-soft" strokeWidth={2} />
        Guardando…
      </span>
    )
  }
  if (status.tipo === "guardado") {
    return (
      <span className="hidden items-center gap-1.5 text-[11px] text-text-muted lg:flex">
        <Check className="size-3 text-success" strokeWidth={2} />
        Guardado {formatRelativeFromNow(status.lastSavedAt)}
      </span>
    )
  }
  return (
    <span className={cn("hidden items-center gap-1.5 text-[11px] text-text-muted lg:flex")}>
      <span aria-hidden="true" className="size-1 rounded-full bg-text-faint" />
      Auto-guardado activo
    </span>
  )
}
