import { cn } from "@/shared/lib/cn"
import { Slot } from "@radix-ui/react-slot"
import type { HTMLAttributes, ReactNode } from "react"
import { forwardRef } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const cardStyles = tv({
  base: ["rounded-lg bg-surface", "transition-all duration-base ease-default"],
  variants: {
    tono: {
      plano: "border border-border",
      elevado: "border border-border shadow-sm hover:shadow-md",
      acento: "border border-accent-soft-hover bg-accent-soft",
      hueco: "border border-border border-dashed bg-canvas",
    },
    densidad: {
      compacta: "p-4",
      base: "p-5",
      generosa: "p-6",
      none: "p-0",
    },
    interactiva: {
      true: "cursor-pointer hover:-translate-y-0.5 hover:border-border-strong focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
      false: "",
    },
  },
  defaultVariants: {
    tono: "plano",
    densidad: "base",
    interactiva: false,
  },
})

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardStyles> {
  readonly asChild?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(props, ref) {
  const { asChild, tono, densidad, interactiva, className, ...rest } = props
  const Comp = asChild ? Slot : "div"
  return (
    <Comp ref={ref} className={cardStyles({ tono, densidad, interactiva, className })} {...rest} />
  )
})

interface CardHeaderProps {
  readonly eyebrow?: ReactNode
  readonly titulo: ReactNode
  readonly accion?: ReactNode
  readonly className?: string
}

export function CardHeader({ eyebrow, titulo, accion, className }: CardHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        {eyebrow ? <span className="nx-eyebrow text-text-tertiary">{eyebrow}</span> : null}
        <h3 className="truncate text-h3 text-text-primary">{titulo}</h3>
      </div>
      {accion ? <div className="flex shrink-0 items-center gap-2">{accion}</div> : null}
    </header>
  )
}
