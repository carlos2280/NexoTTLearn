import { cn } from "@/shared/lib/cn"
import type { LucideIcon } from "lucide-react"
import type { HTMLAttributes, ReactNode } from "react"

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly icon?: LucideIcon
  readonly title: string
  readonly description?: ReactNode
  readonly action?: ReactNode
  readonly secondaryAction?: ReactNode
  readonly variant?: "page" | "inline"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "page",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "page" && "gap-5 px-6 py-16",
        variant === "inline" && "gap-3 px-4 py-10",
        className,
      )}
      {...props}
    >
      {Icon ? (
        <div
          aria-hidden="true"
          className={cn(
            "relative flex items-center justify-center",
            "rounded-[var(--radius-2xl)]",
            "border border-glass-border bg-glass-1",
            "before:absolute before:inset-[-1px] before:rounded-[var(--radius-2xl)]",
            "before:bg-[var(--gradient-brand-soft)] before:opacity-60",
            variant === "page" ? "size-16" : "size-12",
          )}
        >
          <Icon
            className={cn(
              "relative text-brand-violet-soft",
              variant === "page" ? "size-7" : "size-5",
            )}
            strokeWidth={1.5}
          />
        </div>
      ) : null}
      <div className="flex max-w-md flex-col gap-2">
        <h3
          className={cn(
            "font-semibold text-text-primary tracking-tight",
            variant === "page" ? "text-lg" : "text-base",
          )}
        >
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        ) : null}
      </div>
      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
