import { useTimerEntrevista } from "./use-timer-entrevista"

interface CabeceraChatProps {
  readonly inicioISO: string
  readonly activa: boolean
}

/**
 * Cabecera respiratoria del chat de entrevista IA. Eyebrow mono +
 * dot pulse aurora-cyan + timer `MM:SS`. Sin countdown agresivo,
 * sin contador de turnos restantes — el tiempo no es enemigo.
 */
export function CabeceraChat({ inicioISO, activa }: CabeceraChatProps) {
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
    </header>
  )
}
