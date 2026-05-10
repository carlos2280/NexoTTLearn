import { cn } from "@/shared/lib/cn"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Button } from "@/shared/ui/primitives/button"
import { Card } from "@/shared/ui/primitives/card"
import type { DashboardColaRevision } from "@nexott-learn/shared-types"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { resolverIcono } from "../lib/icon-map"
import { classesIconWrap } from "../lib/tone-classes"

interface CentroRevisionBannerProps {
  readonly cola: DashboardColaRevision | undefined
  readonly loading: boolean
}

export function CentroRevisionBanner({ cola, loading }: CentroRevisionBannerProps) {
  const navigate = useNavigate()
  if (loading || !cola) {
    return (
      <Card variant="glass" padding="lg" className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-12 w-full" />
      </Card>
    )
  }

  const total = cola.items.reduce((acc, item) => acc + item.count, 0)
  const alDia = total === 0

  return (
    <Card
      variant="glass"
      padding="lg"
      className={cn(
        "relative overflow-hidden",
        !alDia &&
          "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:from-[rgb(124_58_237/0.08)] before:via-transparent before:to-[rgb(34_211_238/0.08)]",
      )}
    >
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-[var(--radius-md)] border border-glass-border",
              alDia ? classesIconWrap("success") : classesIconWrap("brand"),
            )}
          >
            <CheckCircle2 className="size-6" strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="font-semibold text-base text-text-primary tracking-tight">
              {cola.title}
            </h2>
            <p className="text-sm text-text-secondary">{cola.description}</p>
            {alDia ? null : (
              <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1.5">
                {cola.items
                  .filter((item) => item.count > 0)
                  .map((item) => {
                    const Icon = resolverIcono(item.icon)
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.href}
                          className="group inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
                        >
                          <Icon
                            className={cn(
                              "size-4 transition",
                              item.tone === "danger" && "text-danger",
                              item.tone === "warning" && "text-warning",
                              item.tone === "neutral" && "text-text-muted",
                            )}
                            strokeWidth={1.75}
                          />
                          <span className="font-semibold text-brand-violet-soft tabular-nums">
                            {item.count}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        </div>
        <Button
          size={alDia ? "md" : "lg"}
          variant={alDia ? "secondary" : "primary"}
          onClick={() => navigate(cola.href)}
        >
          {alDia ? "Abrir Centro" : "Ir al Centro"}
          <ArrowRight className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </Card>
  )
}
