import type { VistaModulo } from "@nexott-learn/shared-types"
import { Check } from "lucide-react"

interface ModuloNumIndicatorProps {
  readonly modulo: VistaModulo
}

// §4.3.3 indicador izquierdo segun estado y excelencia.
// Breathing ring solo si esSiguientePaso=true (no en todos los EN_PROGRESO).
export function ModuloNumIndicator({ modulo }: ModuloNumIndicatorProps) {
  if (modulo.estado === "COMPLETADO") {
    if (modulo.excelencia) {
      return (
        <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[length:200%_100%] bg-gradient-to-br from-brand-violet via-brand-cyan to-brand-violet shadow-md [animation:shimmer_2.4s_linear_infinite]">
          <Check className="size-5 text-white" strokeWidth={2.5} />
        </span>
      )
    }
    return (
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success shadow-md">
        <Check className="size-5 text-white" strokeWidth={2.5} />
      </span>
    )
  }

  if (modulo.estado === "EN_PROGRESO") {
    return (
      <span className="relative grid size-12 shrink-0 place-items-center">
        {modulo.esSiguientePaso ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full [animation:pulse-glow_2.6s_var(--ease-in-out)_infinite]"
          />
        ) : null}
        <span className="relative grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan font-bold text-sm text-white shadow-md">
          {modulo.numero}
        </span>
      </span>
    )
  }

  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-full border border-glass-border-strong bg-surface-2 font-semibold text-sm text-text-secondary">
      {modulo.numero}
    </span>
  )
}
