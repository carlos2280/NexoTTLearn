import { cn } from "@/shared/lib/cn"
import { tv } from "@/shared/lib/tv"
import { Slot } from "@radix-ui/react-slot"
import type { HTMLAttributes, ReactNode } from "react"
import { forwardRef } from "react"
import type { VariantProps } from "tailwind-variants"

const cardStyles = tv({
  base: ["rounded-2xl bg-surface", "transition-all duration-base ease-default"],
  variants: {
    tono: {
      // Card neutra estándar — el caballo de batalla del dashboard.
      plano: "border border-border shadow-[var(--shadow-card-resting)]",
      // Elevada — la que pide atención. Sombra multi-layer del sistema nuevo.
      elevado:
        "border border-border shadow-[var(--shadow-card-resting)] hover:shadow-[var(--shadow-card-elevated)]",
      // Acento — fondo soft de índigo. Acción primaria sutil.
      acento: "border border-accent-soft-hover bg-accent-soft",
      // Hueco — para "vacío", drop zones, placeholders.
      hueco: "border border-border border-dashed bg-canvas",
      // Hero — momento cumbre. Gradient sutil + borde accent + sombra elevada.
      // Para "tu siguiente paso", KPI hero, certificación, "listo para presentarse".
      hero: [
        "border border-accent/20",
        "bg-[image:var(--gradient-card-acento)]",
        "shadow-[var(--shadow-card-elevated)]",
      ],
    },
    densidad: {
      compacta: "p-4",
      base: "p-5",
      generosa: "p-6",
      none: "p-0",
    },
    interactiva: {
      true: [
        "cursor-pointer",
        "hover:-translate-y-0.5 hover:border-border-strong",
        "hover:shadow-[var(--shadow-card-elevated)]",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
      ],
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
