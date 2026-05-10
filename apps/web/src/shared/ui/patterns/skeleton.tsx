import { cn } from "@/shared/lib/cn"
import { type HTMLAttributes, forwardRef } from "react"

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "relative overflow-hidden rounded-sm bg-glass-2",
          "before:absolute before:inset-0",
          "before:bg-[linear-gradient(90deg,transparent,var(--glass-3),transparent)]",
          "before:animate-shimmer before:bg-[length:200%_100%]",
          className,
        )}
        {...props}
      />
    )
  },
)
