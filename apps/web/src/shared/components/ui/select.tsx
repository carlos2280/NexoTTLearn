import { cn } from "@/shared/lib/cn"
import { ChevronDown } from "lucide-react"
import type { SelectHTMLAttributes } from "react"
import { forwardRef } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly hasError?: boolean
  readonly compact?: boolean
  readonly variant?: "default" | "ghost"
}

/**
 * Select NexoTT — wrapper estilizado sobre `<select>` nativo.
 *
 * Variantes:
 * - `default`: rounded-lg, border y shadow propios. Para formularios densos.
 * - `ghost`: sin border, sin shadow, sin bg. Para componer dentro de toolbars
 *   o pills compuestas (ej. filtros inline tipo "Estado: Activos").
 *
 * Nota: el dropdown abierto lo renderiza el sistema operativo.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(props, ref) {
  const { hasError, compact, variant = "default", className, children, disabled, ...rest } = props
  const esGhost = variant === "ghost"
  return (
    <div
      data-disabled={disabled || undefined}
      data-invalid={hasError || undefined}
      className={cn(
        "group/select relative inline-flex w-full items-center",
        "transition-[border-color,box-shadow] duration-base ease-default",
        !esGhost && [
          "rounded-lg border bg-surface shadow-xs",
          "border-border-strong",
          "hover:border-border-emphasis data-[disabled]:hover:border-border-strong",
          "hover:shadow-sm data-[disabled]:hover:shadow-xs",
          "focus-within:border-aurora-violet focus-within:shadow-ring-aurora-soft",
          "data-[invalid]:border-danger data-[invalid]:focus-within:border-danger",
          "data-[invalid]:focus-within:shadow-ring-danger-soft",
          "data-[disabled]:cursor-not-allowed data-[disabled]:bg-subtle data-[disabled]:opacity-60",
        ],
        esGhost && [
          "rounded-pill",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
        ],
      )}
    >
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full appearance-none bg-transparent text-text-primary",
          "cursor-pointer outline-none disabled:cursor-not-allowed",
          esGhost
            ? "h-8 pr-7 pl-1 font-medium text-body-sm"
            : compact
              ? "h-9 pr-9 pl-3 text-body-sm"
              : "h-12 pr-9 pl-4 text-input",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute h-4 w-4 shrink-0",
          esGhost ? "right-1.5" : "right-3",
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
