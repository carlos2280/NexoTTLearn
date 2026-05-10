import { cn } from "@/shared/lib/cn"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export interface TabItem<TValue extends string> {
  readonly value: TValue
  readonly label: string
  readonly icon?: LucideIcon
  readonly badge?: ReactNode
  readonly disabled?: boolean
}

interface TabsProps<TValue extends string> {
  readonly items: readonly TabItem<TValue>[]
  readonly value: TValue
  readonly onChange: (value: TValue) => void
  readonly ariaLabel?: string
  readonly className?: string
}

export function Tabs<TValue extends string>({
  items,
  value,
  onChange,
  ariaLabel = "Secciones",
  className,
}: TabsProps<TValue>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1 border-glass-border border-b", className)}
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => {
              if (!isActive) {
                onChange(item.value)
              }
            }}
            className={cn(
              "relative inline-flex items-center gap-2 px-3.5 py-2.5 font-medium text-sm",
              "transition-colors duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
              "disabled:cursor-not-allowed disabled:opacity-40",
              isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
            )}
          >
            {Icon ? (
              <Icon
                aria-hidden="true"
                className={cn("size-4", isActive ? "text-brand-violet-soft" : "text-text-muted")}
              />
            ) : null}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== null ? (
              <span
                className={cn(
                  "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums",
                  isActive
                    ? "bg-[rgb(124_58_237/0.16)] text-brand-violet-soft"
                    : "bg-glass-2 text-text-muted",
                )}
              >
                {item.badge}
              </span>
            ) : null}
            {isActive ? (
              <span
                aria-hidden="true"
                className="-bottom-px absolute inset-x-2 h-0.5 rounded-full bg-[linear-gradient(90deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
