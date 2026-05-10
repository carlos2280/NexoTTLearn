import { cn } from "@/shared/lib/cn"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Card } from "@/shared/ui/primitives/card"
import type { DashboardActividad } from "@nexott-learn/shared-types"
import { Clock } from "lucide-react"
import { resolverIcono } from "../lib/icon-map"
import { classesHighlight, classesIconWrap } from "../lib/tone-classes"

const SKEL_KEYS = ["a", "b", "c", "d"] as const

interface ActividadFeedProps {
  readonly actividad: readonly DashboardActividad[] | undefined
  readonly loading: boolean
}

export function ActividadFeed({ actividad, loading }: ActividadFeedProps) {
  return (
    <Card variant="glass" padding="lg" className="flex h-full flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-base text-text-primary tracking-tight">
          Actividad reciente
        </h2>
        {!loading && actividad ? (
          <span className="text-text-muted text-xs tabular-nums">{actividad.length}</span>
        ) : null}
      </header>
      {loading || !actividad ? (
        <ul className="flex flex-col gap-3">
          {SKEL_KEYS.map((k) => (
            <li key={k} className="flex items-start gap-3">
              <Skeleton className="size-8 rounded-[var(--radius-sm)]" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      ) : actividad.length === 0 ? (
        <EmptyActividad />
      ) : (
        <ul className="flex flex-col gap-3">
          {actividad.map((item) => (
            <ActividadItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </Card>
  )
}

function ActividadItem({ item }: { readonly item: DashboardActividad }) {
  const Icon = resolverIcono(item.icon)
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-glass-border",
          classesIconWrap(item.tone),
        )}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-sm text-text-primary leading-snug">
          {item.title}
          {item.highlight ? (
            <>
              {" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  classesHighlight(item.highlightTone ?? "neutral"),
                )}
              >
                {item.highlight}
              </span>
            </>
          ) : null}
        </p>
        <p className="text-text-muted text-xs leading-relaxed">{item.meta}</p>
      </div>
    </li>
  )
}

function EmptyActividad() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-full bg-glass-2 text-text-muted"
      >
        <Clock className="size-5" strokeWidth={1.75} />
      </span>
      <p className="font-medium text-sm text-text-primary">Sin actividad reciente</p>
      <p className="text-text-muted text-xs">Aqui veras lo que pase en tus cursos.</p>
    </div>
  )
}
