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
          "text-h1 text-text-primary",
          className,
        )}
      >
        <span>NexoTT</span>
        <span aria-hidden="true" className="text-accent">
          ·
        </span>
        <span className="font-medium text-text-secondary">Learn</span>
      </span>
    )
  }

  if (variant === "full") {
    return (
      <span
        className={cn(
          "inline-flex items-baseline gap-1 font-semibold",
          "text-body text-text-primary",
          className,
        )}
      >
        <span>NexoTT</span>
        <span aria-hidden="true" className="text-accent">
          ·
        </span>
        <span className="text-text-secondary">Learn</span>
      </span>
    )
  }

  return <span className={cn("font-semibold text-body text-text-primary", className)}>NexoTT</span>
}
