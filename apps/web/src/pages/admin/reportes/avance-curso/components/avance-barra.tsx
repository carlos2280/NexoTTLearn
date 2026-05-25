interface AvanceBarraProps {
  readonly porcentaje: number
}

function tokenPorPorcentaje(pct: number): string {
  if (pct >= 100) {
    return "var(--color-state-apto)"
  }
  if (pct >= 70) {
    return "var(--color-state-solido)"
  }
  if (pct >= 30) {
    return "var(--color-state-progreso)"
  }
  return "var(--color-state-en-desarrollo)"
}

export function AvanceBarra({ porcentaje }: AvanceBarraProps) {
  const valor = Math.max(0, Math.min(100, porcentaje))
  const color = tokenPorPorcentaje(valor)

  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-pill bg-subtle"
        role="img"
        aria-label={`Avance ${valor}%`}
      >
        <div
          className="h-full rounded-pill transition-all duration-base ease-default"
          style={{ width: `${valor}%`, background: color }}
        />
      </div>
      <span className="tabular w-10 text-right font-medium font-mono text-caption text-text-primary">
        {valor}%
      </span>
    </div>
  )
}
