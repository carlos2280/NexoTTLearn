import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"
import { cn } from "@/shared/lib/cn"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const { hasError, className, ...rest } = props
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4",
        "text-[15px] text-[var(--color-text-primary)] leading-6",
        "placeholder:text-[var(--color-text-tertiary)]",
        "transition-[border-color,background-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-default)]",
        "hover:border-[var(--color-border-emphasis)]",
        "focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]",
        "focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-subtle)] disabled:opacity-50",
        hasError
          ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)]"
          : "border-[var(--color-border-strong)]",
        className,
      )}
      {...rest}
    />
  )
})
