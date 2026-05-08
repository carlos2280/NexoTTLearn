import { cn } from "@/shared/lib/cn"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { type ButtonHTMLAttributes, forwardRef } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const button = tv({
  base: [
    "relative inline-flex items-center justify-center gap-2",
    "font-medium tracking-tight whitespace-nowrap select-none",
    "rounded-[var(--radius-md)] transition-all duration-200",
    "ease-[cubic-bezier(0.2,0.8,0.2,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  variants: {
    variant: {
      primary: [
        "text-text-on-brand shadow-[0_4px_20px_rgb(124_58_237/0.35)]",
        "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
        "bg-[length:200%_100%] bg-[position:0%_0%]",
        "hover:bg-[position:100%_0%] hover:shadow-[0_6px_28px_rgb(124_58_237/0.5)]",
        "hover:-translate-y-0.5 active:translate-y-0",
      ],
      secondary: [
        "text-text-primary glass-surface",
        "hover:bg-glass-2 hover:border-glass-border-strong",
      ],
      ghost: ["text-text-secondary bg-transparent", "hover:bg-glass-1 hover:text-text-primary"],
      outline: [
        "text-text-primary bg-transparent border border-glass-border",
        "hover:border-brand-violet hover:bg-[rgb(124_58_237/0.06)]",
      ],
      danger: [
        "text-white bg-danger shadow-[0_4px_20px_rgb(244_63_94/0.3)]",
        "hover:bg-[#e11d48] hover:-translate-y-0.5",
      ],
    },
    size: {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0",
    },
    full: {
      true: "w-full",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  readonly loading?: boolean
  readonly asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, full, loading, asChild, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      className={cn(button({ variant, size, full }), className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      <Slottable>{children}</Slottable>
    </Comp>
  )
})
