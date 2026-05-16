import { cn } from "@/shared/lib/cn"
import { AlertCircle } from "lucide-react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { forwardRef, useId } from "react"

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  readonly label: string
  readonly icon?: ReactNode
  readonly rightSlot?: ReactNode
  readonly error?: string
  readonly hint?: string
  readonly hasError?: boolean
  readonly containerClassName?: string
}

/**
 * TextField — input "rico" con icono + label embebido en el contenedor.
 *
 * Identidad visual de los formularios premium (login, onboarding, perfil).
 * El contenedor entero responde a :focus-within y a aria-invalid: el halo
 * aurora rodea todo, no solo el input. Coexiste con `Input`/`Field` clásicos.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(props, ref) {
    const {
      label,
      icon,
      rightSlot,
      error,
      hint,
      hasError,
      disabled,
      id: idProp,
      className,
      containerClassName,
      ...rest
    } = props

    const reactId = useId()
    const id = idProp ?? `tf-${reactId}`
    const hintId = hint ? `${id}-hint` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = errorId ?? hintId
    const isInvalid = Boolean(error) || Boolean(hasError)

    return (
      <div className="flex flex-col gap-1.5">
        <div
          data-invalid={isInvalid || undefined}
          data-disabled={disabled || undefined}
          className={cn(
            // Contenedor — la "card" del campo
            "group/field relative flex items-center gap-3 rounded-xl border bg-surface px-4 py-3",
            "border-border-strong shadow-xs",
            "transition-[border-color,box-shadow,background-color,transform] duration-base ease-default",
            // Hover sutil — sube ligeramente el peso del borde
            "hover:border-border-emphasis hover:shadow-sm",
            // Focus-within → halo aurora (firma del producto)
            "focus-within:border-aurora-violet focus-within:shadow-ring-aurora-soft",
            // Error
            "data-[invalid]:border-danger data-[invalid]:focus-within:border-danger",
            "data-[invalid]:focus-within:shadow-ring-danger-soft",
            // Disabled
            "data-[disabled]:cursor-not-allowed data-[disabled]:bg-subtle data-[disabled]:opacity-60",
            "data-[disabled]:hover:border-border-strong data-[disabled]:hover:shadow-xs",
            containerClassName,
          )}
        >
          {icon ? (
            <span
              aria-hidden="true"
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center text-text-tertiary",
                "transition-colors duration-base ease-default",
                "group-focus-within/field:text-aurora-violet",
                "group-data-[invalid]/field:text-danger",
              )}
            >
              {icon}
            </span>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <label
              htmlFor={id}
              className={cn(
                "nx-eyebrow text-text-tertiary",
                "transition-colors duration-base ease-default",
                "group-focus-within/field:text-aurora-violet",
                "group-data-[invalid]/field:text-danger",
              )}
            >
              {label}
            </label>
            <input
              ref={ref}
              id={id}
              aria-invalid={isInvalid || undefined}
              aria-describedby={describedBy}
              disabled={disabled}
              className={cn(
                "h-7 w-full bg-transparent text-input text-text-primary",
                "placeholder:text-text-tertiary",
                "focus:outline-none disabled:cursor-not-allowed",
                className,
              )}
              {...rest}
            />
          </div>

          {rightSlot ? <span className="flex shrink-0 items-center">{rightSlot}</span> : null}
        </div>

        {error ? (
          <p id={errorId} className="flex items-center gap-1.5 text-caption text-danger">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p id={hintId} className="text-caption text-text-tertiary">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)
