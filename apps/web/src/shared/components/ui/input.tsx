import { cn } from "@/shared/lib/cn"
import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const { hasError, className, ...rest } = props
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-md border bg-surface px-4 text-input text-text-primary",
        "placeholder:text-text-tertiary",
        "transition-[border-color,background-color,box-shadow] duration-base ease-default",
        "hover:border-border-emphasis",
        "focus:border-accent focus:shadow-ring-accent-soft focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-50",
        hasError
          ? "border-danger focus:border-danger focus:shadow-ring-danger-soft"
          : "border-border-strong",
        className,
      )}
      {...rest}
    />
  )
})
