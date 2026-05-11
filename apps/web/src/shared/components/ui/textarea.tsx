import { cn } from "@/shared/lib/cn"
import type { TextareaHTMLAttributes } from "react"
import { forwardRef } from "react"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly hasError?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    const { hasError, className, ...rest } = props
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-none rounded-md border bg-surface px-3 py-2 text-input text-text-primary",
          "placeholder:text-text-tertiary",
          "transition-[border-color,box-shadow] duration-base ease-default",
          "hover:border-border-emphasis",
          "focus:border-accent focus:shadow-ring-accent-soft focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-50",
          hasError
            ? "border-danger focus:border-danger focus:shadow-ring-danger-soft"
            : "border-border-strong",
          className,
        )}
        {...rest}
      />
    )
  },
)
