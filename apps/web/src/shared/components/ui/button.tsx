import { tv } from "@/shared/lib/tv"
import { Slot } from "@radix-ui/react-slot"
import type { ButtonHTMLAttributes } from "react"
import { forwardRef } from "react"
import type { VariantProps } from "tailwind-variants"

const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap",
    "cursor-pointer rounded-pill font-medium",
    "transition-[background-color,background-position,border-color,color,box-shadow,transform] duration-base ease-default",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "active:scale-[0.98] active:translate-y-0",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:hover:translate-y-0",
  ],
  variants: {
    variant: {
      // Primary — índigo del trabajo. Lift sutil + glow multi-layer al hover.
      primary: [
        "bg-accent text-on-color",
        "shadow-accent-glow hover:shadow-accent-glow-lg hover:-translate-y-0.5",
        "hover:bg-accent-hover active:bg-accent-pressed",
      ],
      // Aurora — CTA "premium" para momentos cumbre (login, publicar, completar).
      aurora: [
        "relative text-on-color",
        "bg-[image:var(--gradient-aurora)] bg-[length:180%_180%] bg-[position:0%_50%]",
        "shadow-aurora-glow hover:-translate-y-0.5",
        "hover:bg-[position:100%_50%] hover:shadow-[0_18px_46px_rgb(var(--color-aurora-violet-rgb)/0.42)]",
        "focus-visible:outline-aurora-violet",
      ],
      // Secondary — acción alternativa. Hover sube color de borde + lift.
      secondary: [
        "bg-surface text-text-primary",
        "border border-border-strong",
        "hover:bg-subtle hover:border-border-emphasis hover:-translate-y-0.5 hover:shadow-sm",
      ],
      // Ghost — sin elevación; solo cambio de fondo.
      ghost: ["bg-transparent text-text-primary", "hover:bg-subtle"],
      // Danger — destructiva. Lift sutil para confirmar peso de la acción.
      danger: [
        "bg-danger text-on-color",
        "shadow-[0_8px_24px_rgb(var(--color-danger-rgb)/0.22)]",
        "hover:opacity-95 hover:-translate-y-0.5",
        "hover:shadow-[0_12px_32px_rgb(var(--color-danger-rgb)/0.32)]",
      ],
      // Link — texto. No lift, no shadow.
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
      {asChild ? (
        children
      ) : (
        <>
          {isLoading ? <Spinner /> : null}
          {children}
        </>
      )}
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
