import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

interface SwitchProps {
  readonly checked: boolean
  readonly onCambio: (valor: boolean) => void
  readonly label?: ReactNode
  readonly descripcion?: ReactNode
  readonly disabled?: boolean
  readonly id?: string
  readonly className?: string
}

/**
 * Switch NexoTT — toggle pill estilo Apple/Linear.
 *
 * Reemplazo del checkbox nativo cuando la semántica es "encender/apagar"
 * (no "marcar como hecho"). Animación suave del thumb, color accent cuando
 * activo, neutro cuando inactivo.
 *
 * Etiqueta opcional al lado del switch — todo el bloque es clickeable.
 */
export function Switch({
  checked,
  onCambio,
  label,
  descripcion,
  disabled,
  id,
  className,
}: SwitchProps) {
  const conTexto = label !== undefined || descripcion !== undefined

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={id ? `${id}-label` : undefined}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onCambio(!checked)
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-pill",
        "transition-colors duration-base ease-default",
        "focus-visible:shadow-ring-accent-soft focus-visible:outline-none",
        checked ? "bg-accent" : "bg-border-strong",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        aria-hidden={true}
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-surface shadow-sm",
          "transition-transform duration-base ease-default",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  )

  if (!conTexto) {
    return <span className={className}>{control}</span>
  }

  return (
    <div
      className={cn(
        "inline-flex items-start gap-3",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      )}
      onClick={() => {
        if (!disabled) {
          onCambio(!checked)
        }
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onCambio(!checked)
        }
      }}
      role="presentation"
    >
      {control}
      <span className="flex flex-col gap-0.5" id={id ? `${id}-label` : undefined}>
        {label ? <span className="text-body-sm text-text-primary">{label}</span> : null}
        {descripcion ? (
          <span className="text-caption text-text-tertiary">{descripcion}</span>
        ) : null}
      </span>
    </div>
  )
}
