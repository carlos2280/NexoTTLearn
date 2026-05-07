import { cn } from "@/shared/lib/cn"
import { type HTMLAttributes, forwardRef } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const badge = tv({
  base: [
    "inline-flex items-center gap-1.5 whitespace-nowrap select-none",
    "font-medium tracking-tight",
    "rounded-[var(--radius-full)] border",
    "[&_svg]:size-3 [&_svg]:shrink-0",
  ],
  variants: {
    tone: {
      neutral: "bg-glass-1 border-glass-border text-text-secondary",
      brand: [
        "border-transparent text-text-on-brand",
        "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
      ],
      violet: "bg-[rgb(124_58_237/0.14)] border-[rgb(124_58_237/0.3)] text-brand-violet-soft",
      success: "bg-[var(--success-bg)] border-[rgb(16_185_129/0.3)] text-success",
      warning: "bg-[var(--warning-bg)] border-[rgb(245_158_11/0.3)] text-warning",
      danger: "bg-[var(--danger-bg)] border-[rgb(244_63_94/0.3)] text-danger",
      info: "bg-[var(--info-bg)] border-[rgb(56_189_248_/0.3)] text-info",
    },
    size: {
      sm: "h-5 px-2 text-[10px] uppercase tracking-wider",
      md: "h-6 px-2.5 text-xs",
      lg: "h-7 px-3 text-sm",
    },
    dot: { true: "" },
  },
  defaultVariants: {
    tone: "neutral",
    size: "md",
  },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, size, dot, children, ...props },
  ref,
) {
  return (
    <span ref={ref} className={cn(badge({ tone, size }), className)} {...props}>
      {dot ? (
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotTone(tone))} />
      ) : null}
      {children}
    </span>
  )
})

function dotTone(tone: BadgeProps["tone"]): string {
  switch (tone) {
    case "success":
      return "bg-success"
    case "warning":
      return "bg-warning"
    case "danger":
      return "bg-danger"
    case "info":
      return "bg-info"
    case "violet":
    case "brand":
      return "bg-brand-violet"
    default:
      return "bg-text-muted"
  }
}
