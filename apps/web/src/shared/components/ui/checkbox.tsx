import { cn } from "@/shared/lib/cn"
import { Check } from "lucide-react"
import type { InputHTMLAttributes, ReactNode } from "react"
import { forwardRef, useId } from "react"

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  readonly label?: ReactNode
  readonly hint?: string
  readonly hasError?: boolean
}

/**
 * Checkbox NexoTT.
 *
 * Visual: cuadrado con border, micro-shadow resting, halo aurora-soft al focus,
 * fondo accent + check blanco al marcar. Micro-bounce del check al transicionar
 * (scale 0 → 1 con ease-out-expo). Sin emojis ni colores chillones.
 *
 * Uso:
 *   <Checkbox label="Incluir archivados" checked={...} onChange={...} />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
  const { label, hint, hasError, disabled, id: idProp, className, ...rest } = props
  const reactId = useId()
  const id = idProp ?? `chk-${reactId}`
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <span className="relative inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-describedby={hintId}
          aria-invalid={hasError || undefined}
          disabled={disabled}
          className="peer h-full w-full cursor-pointer appearance-none rounded-md border border-border-strong bg-surface shadow-xs transition-[background-color,border-color,box-shadow] duration-base ease-default checked:border-accent checked:bg-accent hover:border-border-emphasis focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:shadow-ring-danger-soft"
          {...rest}
        />
        {/* Check superpuesto — pointer-events-none para que el clic siga llegando al input.
            Scale 0 → 1 al estado :checked del peer. */}
        <Check
          aria-hidden={true}
          strokeWidth={3}
          className="pointer-events-none absolute h-3 w-3 scale-0 text-white opacity-0 transition-[transform,opacity] duration-base ease-default peer-checked:scale-100 peer-checked:opacity-100"
        />
      </span>

      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer select-none text-body-sm leading-[18px]",
            disabled ? "cursor-not-allowed text-text-tertiary" : "text-text-primary",
          )}
        >
          {label}
          {hint ? (
            <span id={hintId} className="mt-0.5 block text-caption text-text-tertiary">
              {hint}
            </span>
          ) : null}
        </label>
      ) : null}
    </div>
  )
})
