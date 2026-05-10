interface TooltipPayloadItem {
  readonly value: number
  readonly name?: string
  readonly dataKey?: string
  readonly color?: string
  readonly payload?: Record<string, unknown>
}

interface TooltipChartProps {
  readonly active?: boolean
  readonly payload?: readonly TooltipPayloadItem[]
  readonly label?: string
  readonly unidad?: string
  readonly mostrarObjetivo?: boolean
}

export function TooltipChart({
  active,
  payload,
  label,
  unidad = "",
  mostrarObjetivo = false,
}: TooltipChartProps) {
  if (!(active && payload) || payload.length === 0) {
    return null
  }
  const item = payload[0]
  if (!item) {
    return null
  }
  const objetivoRaw =
    mostrarObjetivo && item.payload && typeof item.payload.objetivo === "number"
      ? item.payload.objetivo
      : null

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--glass-border-strong)] bg-[var(--surface-2)] px-3 py-2 shadow-[var(--shadow-md)]">
      {label && (
        <div className="mb-1 font-medium text-[var(--text-secondary)] text-xs">{label}</div>
      )}
      <div className="flex items-baseline gap-1">
        <span className="font-semibold text-[var(--text-primary)] text-base tabular-nums">
          {Math.round(item.value)}
        </span>
        {unidad && <span className="text-[var(--text-muted)] text-xs">{unidad}</span>}
      </div>
      {objetivoRaw !== null && (
        <div className="mt-1 text-[var(--text-muted)] text-xs">
          Objetivo: <span className="text-[var(--text-secondary)]">{objetivoRaw}</span>
        </div>
      )}
    </div>
  )
}
