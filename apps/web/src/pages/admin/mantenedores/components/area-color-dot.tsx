import { cn } from "@/shared/lib/cn"

interface AreaColorDotProps {
  readonly color: string
  readonly size?: "sm" | "md"
  readonly className?: string
}

const NOMBRES_DS: Record<string, string> = {
  indigo: "var(--ds-area-indigo, #6366f1)",
  emerald: "var(--ds-area-emerald, #10b981)",
  violet: "var(--brand-violet)",
  amber: "var(--ds-area-amber, #f59e0b)",
  rose: "var(--ds-area-rose, #f43f5e)",
  cyan: "var(--brand-cyan)",
  slate: "var(--ds-area-slate, #64748b)",
}

function resolveColor(value: string): string {
  return NOMBRES_DS[value] ?? value
}

export function AreaColorDot({ color, size = "md", className }: AreaColorDotProps) {
  const value = resolveColor(color)
  return (
    <span
      aria-hidden="true"
      className={cn(
        "shrink-0 rounded-full border border-glass-border-strong",
        size === "sm" ? "size-3" : "size-4",
        className,
      )}
      style={{ background: value }}
    />
  )
}
