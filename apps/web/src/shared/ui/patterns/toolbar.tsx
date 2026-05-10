import { cn } from "@/shared/lib/cn"
import type { HTMLAttributes, ReactNode } from "react"

interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  readonly search?: ReactNode
  readonly filters?: ReactNode
  readonly viewToggle?: ReactNode
  readonly trailing?: ReactNode
}

export function Toolbar({
  search,
  filters,
  viewToggle,
  trailing,
  className,
  ...props
}: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3",
        "rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-3",
        className,
      )}
      {...props}
    >
      {search ? <div className="min-w-0 flex-1 lg:max-w-md">{search}</div> : null}
      {filters ? (
        <div className="flex flex-wrap items-center gap-2 lg:flex-1 lg:justify-start">
          {filters}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {viewToggle}
        {trailing}
      </div>
    </div>
  )
}
