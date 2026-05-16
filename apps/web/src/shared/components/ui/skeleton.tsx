import { cn } from "@/shared/lib/cn"
import type { HTMLAttributes } from "react"

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly forma?: "linea" | "bloque" | "circulo"
}

export function Skeleton({ forma = "linea", className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-busy={true}
      aria-hidden={true}
      className={cn(
        "animate-pulse bg-muted",
        forma === "linea" && "h-4 w-full rounded-sm",
        forma === "bloque" && "h-20 w-full rounded-md",
        forma === "circulo" && "h-8 w-8 rounded-pill",
        className,
      )}
      {...rest}
    />
  )
}
