import { configSemaforo } from "@/features/admin-seguimiento/lib/semaforo"
import { cn } from "@/shared/lib/cn"
import type { MatrizCelda } from "@nexott-learn/shared-types"
import { tv } from "tailwind-variants"

const cellTone = tv({
  base: [
    "flex h-full w-full flex-col items-center justify-center gap-0.5",
    "rounded-[var(--radius-md)] border px-2 py-1.5",
    "transition-colors duration-150",
    "hover:border-brand-violet/40 hover:bg-glass-2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
    "cursor-pointer",
  ],
  variants: {
    tone: {
      success: "border-[rgb(16_185_129/0.3)] bg-[var(--success-bg)] text-success",
      warning: "border-[rgb(245_158_11/0.3)] bg-[var(--warning-bg)] text-warning",
      danger: "border-[rgb(244_63_94/0.3)] bg-[var(--danger-bg)] text-danger",
      muted: "border-glass-border bg-glass-1 text-text-muted",
    },
  },
})

interface CeldaSemaforoProps {
  readonly celda: MatrizCelda
  readonly onClick: () => void
  readonly umbral: number
}

export function CeldaSemaforo({ celda, onClick, umbral }: CeldaSemaforoProps) {
  const cfg = configSemaforo(celda.semaforo)
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Nota ${celda.nota ?? "—"} / umbral ${umbral} · ${cfg.label}`}
      className={cn(cellTone({ tone: cfg.tone }))}
    >
      <span className="font-semibold text-sm tabular-nums">
        {celda.nota === null ? "—" : Math.round(celda.nota)}
      </span>
    </button>
  )
}
