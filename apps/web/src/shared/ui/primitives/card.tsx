import { cn } from "@/shared/lib/cn"
import { type HTMLAttributes, forwardRef } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const card = tv({
  base: ["relative rounded-[var(--radius-xl)] transition-all duration-300"],
  variants: {
    variant: {
      glass: [
        "bg-glass-1 border border-glass-border backdrop-blur-2xl",
        "shadow-[0_24px_60px_-24px_rgb(0_0_0_/0.6)]",
      ],
      solid: ["bg-surface-1 border border-glass-border"],
      ghost: ["bg-transparent border border-transparent"],
    },
    interactive: {
      true: "hover:border-glass-border-strong hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-20px_rgb(124_58_237/0.35)]",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    },
  },
  defaultVariants: {
    variant: "glass",
    padding: "md",
  },
})

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof card> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, interactive, padding, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn(card({ variant, interactive, padding }), className)} {...props} />
  )
})
