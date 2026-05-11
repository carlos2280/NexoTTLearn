import type { HTMLAttributes } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const badgeStyles = tv({
  base: [
    "inline-flex items-center gap-1.5 whitespace-nowrap",
    "rounded-pill px-2.5 py-0.5",
    "text-caption font-medium",
  ],
  variants: {
    tono: {
      neutro: "bg-subtle text-text-secondary",
      acento: "bg-accent-soft text-accent-on-soft",
      success: "bg-success-soft text-success-on-soft",
      warning: "bg-warning-soft text-warning-on-soft",
      danger: "bg-danger-soft text-danger-on-soft",
      info: "bg-info-soft text-info-on-soft",
      contorno: "border border-border-strong bg-transparent text-text-secondary",
    },
  },
  defaultVariants: {
    tono: "neutro",
  },
})

const dotStyles = tv({
  base: "inline-block h-1.5 w-1.5 shrink-0 rounded-pill",
  variants: {
    tono: {
      neutro: "bg-text-tertiary",
      acento: "bg-accent",
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-danger",
      info: "bg-info",
      contorno: "bg-text-tertiary",
    },
  },
  defaultVariants: { tono: "neutro" },
})

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeStyles> {
  readonly conPunto?: boolean
}

export function Badge(props: BadgeProps) {
  const { tono, conPunto, className, children, ...rest } = props
  return (
    <span className={badgeStyles({ tono, className })} {...rest}>
      {conPunto ? <span className={dotStyles({ tono })} aria-hidden={true} /> : null}
      {children}
    </span>
  )
}
