import { configSemaforo } from "@/features/admin-seguimiento/lib/semaforo"
import { cn } from "@/shared/lib/cn"
import type { MatrizCelda } from "@nexott-learn/shared-types"
import { tv } from "tailwind-variants"

const cellTone = tv({
  base: [
    "group flex h-full w-full flex-col items-stretch justify-center gap-1.5",
    "rounded-[var(--radius-md)] border px-2.5 py-2",
    "transition-all duration-200",
    "hover:scale-[1.02] hover:border-[var(--brand-violet)]/40 hover:bg-[var(--glass-2)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-violet)]",
    "cursor-pointer",
  ],
  variants: {
    tone: {
      success: "border-[rgb(16_185_129/0.25)] bg-[var(--success-bg)]",
      warning: "border-[rgb(245_158_11/0.25)] bg-[var(--warning-bg)]",
      danger: "border-[rgb(244_63_94/0.25)] bg-[var(--danger-bg)]",
      muted: "border-[var(--glass-border)] bg-[var(--glass-1)]",
    },
  },
})

const numColor = tv({
  base: "font-semibold text-sm tabular-nums",
  variants: {
    tone: {
      success: "text-[var(--success)]",
      warning: "text-[var(--warning)]",
      danger: "text-[var(--danger)]",
      muted: "text-[var(--text-muted)]",
    },
  },
})

const barFill = tv({
  base: "h-full rounded-full transition-all duration-500",
  variants: {
    tone: {
      success: "bg-[var(--success)]",
      warning: "bg-[var(--warning)]",
      danger: "bg-[var(--danger)]",
      muted: "bg-[var(--text-faint)]",
    },
  },
})

interface CeldaTrayectoriaProps {
  readonly celda: MatrizCelda
  readonly umbral: number
  readonly notaInicial: number | null
  readonly onClick: () => void
}

export function CeldaTrayectoria({ celda, umbral, notaInicial, onClick }: CeldaTrayectoriaProps) {
  const cfg = configSemaforo(celda.semaforo)
  const actual = celda.nota
  const sinDato = actual === null

  if (sinDato) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Sin dato · objetivo ${umbral}`}
        className={cn(cellTone({ tone: "muted" }))}
      >
        <span className="text-center text-[var(--text-muted)] text-sm">—</span>
        <BarraConObjetivo valor={0} max={100} objetivo={umbral} tone="muted" />
      </button>
    )
  }

  // Caso "sin diagnóstico": hay nota actual pero no se capturó EvaluacionInicial.
  // Render distinto del "sin dato" (tone muted): mantenemos semáforo del actual
  // pero sustituimos el slot de inicial por un guion en text-faint para señalar
  // explícitamente que falta el diagnóstico.
  if (notaInicial === null) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Sin diagnóstico inicial · actual ${Math.round(actual)} · objetivo ${umbral} · ${cfg.label}`}
        className={cn(cellTone({ tone: cfg.tone }))}
      >
        <div className="flex items-baseline justify-center gap-1.5 font-mono">
          <span className="text-[10px] text-[var(--text-faint)] tabular-nums">—</span>
          <span className="text-[10px] text-[var(--text-faint)]">·</span>
          <span className={cn(numColor({ tone: cfg.tone }))}>{Math.round(actual)}</span>
        </div>
        <BarraConObjetivo valor={actual} max={100} objetivo={umbral} tone={cfg.tone} />
      </button>
    )
  }

  const delta = Math.round(actual - notaInicial)
  const arrow = delta > 0 ? "↗" : delta < 0 ? "↘" : "="

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${notaInicial} → ${Math.round(actual)} · objetivo ${umbral} · ${cfg.label}`}
      className={cn(cellTone({ tone: cfg.tone }))}
    >
      <div className="flex items-baseline justify-center gap-1.5 font-mono">
        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
          {Math.round(notaInicial)}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">{arrow}</span>
        <span className={cn(numColor({ tone: cfg.tone }))}>{Math.round(actual)}</span>
      </div>
      <BarraConObjetivo valor={actual} max={100} objetivo={umbral} tone={cfg.tone} />
    </button>
  )
}

interface BarraProps {
  readonly valor: number
  readonly max: number
  readonly objetivo: number
  readonly tone: "success" | "warning" | "danger" | "muted"
}

function BarraConObjetivo({ valor, max, objetivo, tone }: BarraProps) {
  const pct = Math.max(0, Math.min(100, (valor / max) * 100))
  const objPct = Math.max(0, Math.min(100, (objetivo / max) * 100))
  return (
    <div className="relative h-1.5 w-full overflow-visible rounded-full bg-[var(--glass-1)]">
      <div className={cn(barFill({ tone }))} style={{ width: `${pct}%` }} />
      <span
        className="-translate-x-1/2 absolute top-[-2px] bottom-[-2px] w-px bg-[var(--text-secondary)] opacity-70"
        style={{ left: `${objPct}%` }}
        aria-hidden={true}
      />
    </div>
  )
}
