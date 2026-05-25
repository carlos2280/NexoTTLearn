import { Kbd } from "@/shared/components/ui/kbd"
import { X } from "lucide-react"
import { useTimerEntrevista } from "./use-timer-entrevista"

interface CabeceraChatProps {
  readonly inicioISO: string
  readonly activa: boolean
  readonly onSalir?: () => void
}

/**
 * Cabecera respiratoria del chat de entrevista IA. Eyebrow mono +
 * dot pulse aurora-cyan + timer `MM:SS`. Sin countdown agresivo,
 * sin contador de turnos restantes — el tiempo no es enemigo.
 *
 * A la derecha: botón "Salir" con Kbd `Esc`. Aparece solo cuando la
 * entrevista está activa — al cerrar (vista 3a/3b) el chat ya no necesita
 * escape porque es contenido editorial, no inmersivo.
 */
export function CabeceraChat({ inicioISO, activa, onSalir }: CabeceraChatProps) {
  const tiempo = useTimerEntrevista(inicioISO, activa)
  return (
    <header className="flex items-center gap-3 border-border border-b bg-canvas/60 px-6 py-3 backdrop-blur-sm">
      <span className="nx-eyebrow text-text-tertiary">Entrevista en curso</span>
      <span
        aria-hidden={true}
        className="nx-pulse-dot inline-block h-1.5 w-1.5 rounded-pill bg-aurora-cyan"
        style={{ boxShadow: "0 0 6px 1px rgb(var(--color-aurora-cyan-rgb) / 0.45)" }}
      />
      <span className="tabular font-mono text-caption text-text-secondary">{tiempo}</span>
      {activa && onSalir ? (
        <div className="ml-auto">
          <button
            type="button"
            onClick={onSalir}
            className="group inline-flex items-center gap-2 rounded-pill px-2.5 py-1 text-caption text-text-tertiary transition-colors duration-base ease-default hover:bg-subtle hover:text-text-secondary"
            aria-label="Salir de la entrevista"
          >
            <X className="h-3.5 w-3.5" aria-hidden={true} />
            <span>Salir</span>
            <Kbd className="ml-1 group-hover:border-border-emphasis">Esc</Kbd>
          </button>
        </div>
      ) : null}
    </header>
  )
}
