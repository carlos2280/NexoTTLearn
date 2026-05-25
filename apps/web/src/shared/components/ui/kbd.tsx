import { cn } from "@/shared/lib/cn"
import type { HTMLAttributes } from "react"

interface KbdProps extends HTMLAttributes<HTMLElement> {
  readonly children: string
}

export function Kbd({ children, className, ...rest }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 select-none items-center justify-center",
        "rounded-sm border border-border-strong bg-surface px-1.5",
        "font-mono text-[11px] text-text-secondary leading-none",
        "shadow-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  )
}
