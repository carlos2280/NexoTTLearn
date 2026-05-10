import { cn } from "@/shared/lib/cn"
import type { HTMLAttributes } from "react"

interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  readonly orientation?: "horizontal" | "vertical"
}

export function Divider({ orientation = "horizontal", className, ...props }: DividerProps) {
  return (
    <hr
      aria-orientation={orientation}
      className={cn(
        "border-0 bg-glass-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  )
}
