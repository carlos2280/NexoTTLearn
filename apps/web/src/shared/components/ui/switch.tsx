import { cn } from "@/shared/lib/cn"
import { type ReactNode, useId } from "react"

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
  // a11y: el nombre accesible sale SOLO del label; la descripcion va por
  // aria-describedby (si el label incluyera la descripcion, el nombre del
  // switch cambiaria en cada toggle porque la descripcion depende del estado).
  // useId() da un id estable de fallback cuando el consumidor no pasa `id`, para
  // que el <button role="switch"> nunca quede sin nombre accesible (WCAG 4.1.2).
  const generatedId = useId()
  const baseId = id ?? generatedId
  const labelId = label ? `${baseId}-label` : undefined
  const descId = descripcion ? `${baseId}-desc` : undefined

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={descId}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onCambio(!checked)
      }}
      className={cn(
        // h-6 (24px) cumple el target size minimo de WCAG 2.5.8 AA sin depender
        // de la excepcion de spacing.
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill",
        "transition-colors duration-base ease-default",
        "focus-visible:shadow-ring-accent-soft focus-visible:outline-none",
        checked ? "bg-accent" : "bg-border-strong",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        aria-hidden={true}
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-surface shadow-sm",
          "transition-transform duration-base ease-default",
          checked ? "translate-x-[22px]" : "translate-x-[2px]",
        )}
      />
    </button>
  )

  if (!conTexto) {
    return <span className={className}>{control}</span>
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: el control real es el <button role="switch"> interior (teclado nativo); este onClick del wrapper role="presentation" es solo la conveniencia de mouse de clickear la etiqueta.
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
      role="presentation"
    >
      {control}
      <span className="flex flex-col gap-0.5">
        {label ? (
          <span id={labelId} className="text-body-sm text-text-primary">
            {label}
          </span>
        ) : null}
        {descripcion ? (
          <span id={descId} className="text-caption text-text-tertiary">
            {descripcion}
          </span>
        ) : null}
      </span>
    </div>
  )
}
