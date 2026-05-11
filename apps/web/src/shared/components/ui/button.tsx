import { Slot } from "@radix-ui/react-slot"
import type { ButtonHTMLAttributes } from "react"
import { forwardRef } from "react"
import { type VariantProps, tv } from "tailwind-variants"

const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap",
    "rounded-pill font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-default",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
  ],
  variants: {
    variant: {
      primary: [
        "bg-accent text-accent-text",
        "shadow-accent-glow hover:shadow-accent-glow-lg",
        "hover:bg-accent-hover active:bg-accent-pressed",
      ],
      secondary: [
        "bg-surface text-text-primary",
        "border border-border-strong",
        "hover:bg-subtle hover:border-border-emphasis",
      ],
      ghost: ["bg-transparent text-text-primary", "hover:bg-subtle"],
      danger: ["bg-danger text-white", "hover:opacity-90"],
      link: [
        "bg-transparent text-accent p-0 h-auto",
        "hover:text-accent-hover underline-offset-4 hover:underline",
      ],
    },
    size: {
      sm: "h-9 px-4 text-caption",
      md: "h-11 px-5 text-body",
      lg: "h-12 px-6 text-body",
      icon: "h-10 w-10",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "lg",
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
