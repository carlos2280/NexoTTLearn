import { useEffect, useState } from "react"
import { useAutoSave } from "../hooks/use-auto-save"

interface SectionTitleInlineProps {
  /** Titulo actual de la seccion (controlado por la query). */
  readonly value: string
  /** Persistencia. Recibe el valor nuevo. Lanzar si falla para que el indicador refleje error. */
  readonly onSave: (titulo: string) => Promise<void>
  /** Notifica cambios al padre (para que el indicador agregado sepa "saving"). */
  readonly onStateChange?: (state: "idle" | "saving" | "saved" | "error") => void
}

// Input H1 inline despojado (sin chrome de input). Auto-save con debounce
// 800ms via useAutoSave; flush en blur. El texto se renderiza con la
// tipografia heading del DS via clases utilitarias del ADN.
//
// Cero CSS inline en la app — usamos className y los tokens del DS via las
// utilidades de tipografia (definidas en @carlos2280/nexott-ui/utilities.css).
export function SectionTitleInline({ value, onSave, onStateChange }: SectionTitleInlineProps) {
  const [draft, setDraft] = useState(value)

  // Sincroniza el draft cuando llega un valor nuevo desde el cache (ej. tras
  // crear seccion o invalidacion). Solo si el usuario no esta editando un
  // valor distinto en este momento.
  useEffect(() => {
    setDraft((current) => (current === value ? current : value))
  }, [value])

  const auto = useAutoSave({
    value: draft.trim(),
    initial: value.trim(),
    save: onSave,
  })

  useEffect(() => {
    onStateChange?.(auto.state)
  }, [auto.state, onStateChange])

  return (
    <input
      className="section-editor__title-input"
      type="text"
      value={draft}
      placeholder="Titulo de la seccion"
      aria-label="Titulo de la seccion"
      maxLength={200}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => auto.flush()}
    />
  )
}
