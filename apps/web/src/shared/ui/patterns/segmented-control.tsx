import { cn } from "@/shared/lib/cn"
import type { LucideIcon } from "lucide-react"
import { useId } from "react"

export interface SegmentedOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly icon?: LucideIcon
  readonly hideLabel?: boolean
}

interface SegmentedControlProps<T extends string> {
  readonly value: T
  readonly onChange: (value: T) => void
  readonly options: readonly SegmentedOption<T>[]
  readonly ariaLabel: string
  readonly size?: "sm" | "md"
  readonly className?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  const groupId = useId()
  const heightClass = size === "sm" ? "h-9" : "h-10"
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-md)]",
        "border border-glass-border bg-glass-1 p-1",
        heightClass,
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            aria-labelledby={`${groupId}-${option.value}`}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative inline-flex items-center justify-center gap-1.5",
              "h-full rounded-[var(--radius-sm)] px-3",
              "font-medium text-xs transition-all duration-200",
              "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
              selected
                ? "bg-glass-3 text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {Icon ? <Icon className="size-3.5" aria-hidden="true" strokeWidth={1.75} /> : null}
            <span id={`${groupId}-${option.value}`} className={option.hideLabel ? "sr-only" : ""}>
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
