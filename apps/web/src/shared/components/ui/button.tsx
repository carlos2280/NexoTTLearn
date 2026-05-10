import { Slot } from "@radix-ui/react-slot"
import { type VariantProps, tv } from "tailwind-variants"
import type { ButtonHTMLAttributes } from "react"
import { forwardRef } from "react"

const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap",
    "rounded-[var(--radius-sm)] font-medium",
    "transition-[background-color,border-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-default)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  variants: {
    variant: {
      primary: [
        "bg-[var(--color-accent)] text-[var(--color-accent-text)]",
        "hover:bg-[var(--color-accent-hover)]",
        "active:bg-[var(--color-accent-pressed)]",
      ],
      secondary: [
        "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
        "border border-[var(--color-border-strong)]",
        "hover:bg-[var(--color-subtle)]",
      ],
      ghost: ["bg-transparent text-[var(--color-text-primary)]", "hover:bg-[var(--color-subtle)]"],
      danger: ["bg-[var(--color-danger)] text-white", "hover:opacity-90"],
      link: [
        "bg-transparent text-[var(--color-accent)] p-0 h-auto",
        "hover:text-[var(--color-accent-hover)] underline-offset-4 hover:underline",
      ],
    },
    size: {
      sm: "h-8 px-3 text-[12px] leading-4",
      md: "h-10 px-4 text-[14px] leading-5",
      lg: "h-11 px-5 text-[14px] leading-5",
      icon: "h-9 w-9",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: false,
  },
})

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  readonly asChild?: boolean
  readonly isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    asChild,
    variant,
    size,
    fullWidth,
    isLoading,
    className,
    disabled,
    children,
    type,
    ...rest
  } = props
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={buttonStyles({ variant, size, fullWidth, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...rest}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </Comp>
  )
})

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  )
}
