import { cn } from "@/shared/lib/cn"

interface WordmarkProps {
  readonly variant?: "compact" | "full" | "display"
  readonly className?: string
}

export function Wordmark({ variant = "compact", className }: WordmarkProps) {
  if (variant === "display") {
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-1.5 font-semibold tracking-tight",
          "text-[32px] text-[var(--color-text-primary)] leading-[40px]",
          className,
        )}
      >
        <span>NexoTT</span>
        <span aria-hidden="true" className="text-[var(--color-accent)]">
          ·
        </span>
        <span className="font-medium text-[var(--color-text-secondary)]">Learn</span>
      </span>
    )
  }

  if (variant === "full") {
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-1 font-semibold",
          "text-[14px] text-[var(--color-text-primary)] leading-5",
          className,
        )}
      >
        <span>NexoTT</span>
        <span aria-hidden="true" className="text-[var(--color-accent)]">
          ·
        </span>
        <span className="text-[var(--color-text-secondary)]">Learn</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "font-semibold text-[14px] text-[var(--color-text-primary)] leading-5",
        className,
      )}
    >
      NexoTT
    </span>
  )
}
