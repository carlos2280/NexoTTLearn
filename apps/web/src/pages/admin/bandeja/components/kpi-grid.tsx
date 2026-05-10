import { cn } from "@/shared/lib/cn"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Card } from "@/shared/ui/primitives/card"
import type { DashboardKpi } from "@nexott-learn/shared-types"
import { Link } from "react-router-dom"
import { resolverIcono } from "../lib/icon-map"
import { classesIconWrap } from "../lib/tone-classes"

const KPI_SKELETON_KEYS = ["a", "b", "c", "d"] as const

interface KpiGridProps {
  readonly kpis: readonly DashboardKpi[] | undefined
  readonly loading: boolean
}

export function KpiGrid({ kpis, loading }: KpiGridProps) {
  return (
    <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {loading || !kpis
        ? KPI_SKELETON_KEYS.map((k) => <KpiSkeleton key={k} />)
        : kpis.map((kpi) => <KpiItem key={kpi.id} kpi={kpi} />)}
    </section>
  )
}

function KpiItem({ kpi }: { readonly kpi: DashboardKpi }) {
  const Icon = resolverIcono(kpi.icon)
  const content = (
    <Card
      variant="glass"
      padding="md"
      interactive={kpi.href ? true : undefined}
      className="flex h-full flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] border border-glass-border",
            classesIconWrap(kpi.tone),
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        {kpi.delta ? (
          <span className="rounded-full bg-glass-2 px-2 py-0.5 font-medium text-text-secondary text-xs tabular-nums">
            {kpi.delta}
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-medium text-text-secondary text-xs uppercase tracking-wider">
          {kpi.label}
        </span>
        <span className="font-semibold text-3xl text-text-primary tabular-nums tracking-tight">
          {kpi.value}
        </span>
        {kpi.helper ? (
          <span className="text-text-muted text-xs leading-relaxed">{kpi.helper}</span>
        ) : null}
      </div>
    </Card>
  )

  if (kpi.href) {
    return (
      <Link
        to={kpi.href}
        aria-label={`${kpi.label}: ${kpi.value}`}
        className="rounded-[var(--radius-xl)] outline-none ring-brand-violet-soft transition focus-visible:ring-2"
      >
        {content}
      </Link>
    )
  }
  return content
}

function KpiSkeleton() {
  return (
    <Card variant="glass" padding="md" className="flex h-full flex-col gap-3">
      <Skeleton className="size-10 rounded-[var(--radius-md)]" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-32" />
    </Card>
  )
}
