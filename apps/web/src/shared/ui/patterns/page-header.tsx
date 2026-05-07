import { cn } from "@/shared/lib/cn"
import type { HTMLAttributes, ReactNode } from "react"

interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  readonly eyebrow?: ReactNode
  readonly title: ReactNode
  readonly subtitle?: ReactNode
  readonly actions?: ReactNode
  readonly meta?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow ? (
          <span className="font-semibold text-[11px] text-brand-violet-soft uppercase tracking-wider">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-semibold text-2xl text-text-primary leading-tight tracking-tight md:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-text-secondary leading-relaxed md:text-base">{subtitle}</p>
        ) : null}
        {meta ? <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
