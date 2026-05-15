import { cn } from "@/shared/lib/cn"
import { ChevronDown } from "lucide-react"
import type { SelectHTMLAttributes } from "react"
import { forwardRef } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly hasError?: boolean
  readonly compact?: boolean
}

/**
 * Select NexoTT — wrapper estilizado sobre `<select>` nativo.
 *
 * Identidad:
 * - `rounded-lg`, `shadow-xs` resting → coherencia con SearchField y toggles.
 * - Halo aurora-violet al focus (firma del producto).
 * - Chevron que cambia de tinta al focus.
 * - Hover sutil con `shadow-sm` y `border-border-emphasis`.
 *
 * Nota: el dropdown abierto lo renderiza el sistema operativo. Para un
 * dropdown 100% custom NexoTT, requiere migración a Radix Select.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  const { hasError, compact, className, children, disabled, ...rest } = props
  return (
    <div
      data-disabled={disabled || undefined}
      data-invalid={hasError || undefined}
      className={cn(
        "group/select relative inline-flex w-full items-center rounded-lg border bg-surface shadow-xs",
        "transition-[border-color,box-shadow] duration-base ease-default",
        // Resting
        "border-border-strong",
        // Hover (solo cuando no disabled)
        "hover:border-border-emphasis data-[disabled]:hover:border-border-strong",
        "hover:shadow-sm data-[disabled]:hover:shadow-xs",
        // Focus-within → halo aurora
        "focus-within:border-aurora-violet focus-within:shadow-ring-aurora-soft",
        // Error
        "data-[invalid]:border-danger data-[invalid]:focus-within:border-danger",
        "data-[invalid]:focus-within:shadow-ring-danger-soft",
        // Disabled
        "data-[disabled]:cursor-not-allowed data-[disabled]:bg-subtle data-[disabled]:opacity-60",
      )}
    >
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full appearance-none bg-transparent pr-9 text-text-primary",
          "cursor-pointer outline-none disabled:cursor-not-allowed",
          compact ? "h-9 pl-3 text-body-sm" : "h-12 pl-4 text-input",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-3 h-4 w-4 shrink-0",
          "text-text-tertiary transition-colors duration-base ease-default",
          "group-focus-within/select:text-aurora-violet",
          "group-data-[invalid]/select:text-danger",
        )}
        strokeWidth={1.5}
        aria-hidden={true}
      />
    </div>
  )
})
