import { cn } from "@/shared/lib/cn"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Card } from "@/shared/ui/primitives/card"
import type { DashboardAlerta } from "@nexott-learn/shared-types"
import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import { resolverIcono } from "../lib/icon-map"
import { classesBadge, classesBorderLeft, classesIconWrap } from "../lib/tone-classes"

const SKEL_KEYS = ["a", "b", "c"] as const

interface AlertasListProps {
  readonly alertas: readonly DashboardAlerta[] | undefined
  readonly loading: boolean
}

export function AlertasList({ alertas, loading }: AlertasListProps) {
  return (
    <Card variant="glass" padding="lg" className="flex h-full flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-base text-text-primary tracking-tight">Alertas</h2>
        {!loading && alertas ? (
          <span className="text-text-muted text-xs tabular-nums">{alertas.length}</span>
        ) : null}
      </header>
      {loading || !alertas ? (
        <ul className="flex flex-col gap-2">
          {SKEL_KEYS.map((k) => (
            <li key={k}>
              <Skeleton className="h-20 w-full rounded-[var(--radius-md)]" />
            </li>
          ))}
        </ul>
      ) : alertas.length === 0 ? (
        <EmptyAlertas />
      ) : (
        <ul className="flex flex-col gap-2">
          {alertas.map((alerta) => (
            <li key={alerta.id}>
              <AlertaItem alerta={alerta} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function AlertaItem({ alerta }: { readonly alerta: DashboardAlerta }) {
  const Icon = resolverIcono(alerta.icon)
  return (
    <Link
      to={alerta.href}
      className={cn(
        "group flex items-start gap-3 rounded-[var(--radius-md)] border-l-2 bg-glass-1 px-3 py-3 transition",
        "hover:translate-x-0.5 hover:bg-glass-2",
        "outline-none ring-brand-violet-soft focus-visible:ring-2",
        classesBorderLeft(alerta.tone),
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-glass-border",
          classesIconWrap(alerta.tone),
        )}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider",
              classesBadge(alerta.tagTone),
            )}
          >
            {alerta.tag}
          </span>
        </div>
        <p className="font-medium text-sm text-text-primary leading-snug">{alerta.title}</p>
        <p className="text-text-muted text-xs leading-relaxed">{alerta.meta}</p>
      </div>
      <span className="self-center font-medium text-text-secondary text-xs transition group-hover:text-text-primary">
        {alerta.action} →
      </span>
    </Link>
  )
}

function EmptyAlertas() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full bg-[var(--success-bg)] text-success"
      >
        <CheckCircle2 className="size-5" strokeWidth={1.75} />
      </span>
      <p className="font-medium text-sm text-text-primary">Sin alertas</p>
      <p className="text-text-muted text-xs">Estado limpio.</p>
    </div>
  )
}
