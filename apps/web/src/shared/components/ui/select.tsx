import { cn } from "@/shared/lib/cn"
import { ChevronDown } from "lucide-react"
import type { SelectHTMLAttributes } from "react"
import { forwardRef } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly hasError?: boolean
  readonly compact?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  const { hasError, compact, className, children, ...rest } = props
  return (
    <div className="relative inline-flex w-full items-center">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-md border bg-surface px-3 pr-9 text-text-primary",
          "transition-[border-color,box-shadow] duration-base ease-default",
          "hover:border-border-emphasis",
          "focus:border-accent focus:shadow-ring-accent-soft focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:bg-subtle disabled:opacity-50",
          compact ? "h-9 text-body-sm" : "h-12 text-input",
          hasError
            ? "border-danger focus:border-danger focus:shadow-ring-danger-soft"
            : "border-border-strong",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 h-4 w-4 text-text-tertiary"
        strokeWidth={1.5}
        aria-hidden={true}
      />
    </div>
  )
})
