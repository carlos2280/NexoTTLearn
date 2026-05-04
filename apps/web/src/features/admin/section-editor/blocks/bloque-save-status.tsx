import type { AutoSaveState } from "../hooks/use-auto-save"

interface BloqueSaveStatusProps {
  readonly state: AutoSaveState
}

// Indicador compacto del estado de auto-save dentro del cuerpo de un bloque.
// Mas discreto que el badge global del topbar — basta una palabra y un dot
// de color. Misma estetica que el patron del editor-toolbar (NxtBadge), pero
// inline para no robar foco visual del editor.
export function BloqueSaveStatus({ state }: BloqueSaveStatusProps) {
  if (state === "idle") {
    return null
  }
  const label = labelForState(state)
  const variantClass = `bloque-save-status--${state}`
  return (
    <output className={`bloque-save-status ${variantClass}`} aria-live="polite">
      <span aria-hidden="true" className="bloque-save-status__dot" />
      {label}
    </output>
  )
}

function labelForState(state: Exclude<AutoSaveState, "idle">): string {
  switch (state) {
    case "saving":
      return "Guardando..."
    case "saved":
      return "Guardado"
    case "error":
      return "Error al guardar"
    default: {
      const _never: never = state
      return _never
    }
  }
}
