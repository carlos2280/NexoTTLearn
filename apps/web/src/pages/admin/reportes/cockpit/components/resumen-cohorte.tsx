import type { CoberturaResumenAgregado } from "@nexott-learn/shared-types"

interface ResumenCohorteProps {
  readonly resumen: CoberturaResumenAgregado
  readonly total: number
}

const SEGMENTOS: ReadonlyArray<{
  readonly key: keyof CoberturaResumenAgregado["conteoNiveles"]
  readonly etiqueta: string
  readonly color: string
}> = [
  { key: "excelencia", etiqueta: "Excelencia", color: "rgb(var(--color-success-rgb) / 0.85)" },
  { key: "solido", etiqueta: "Sólido", color: "rgb(var(--color-success-rgb) / 0.5)" },
  { key: "enDesarrollo", etiqueta: "En desarrollo", color: "rgb(var(--color-warning-rgb) / 0.55)" },
  { key: "inicial", etiqueta: "Inicial", color: "rgb(var(--color-danger-rgb) / 0.6)" },
  { key: "sinTocar", etiqueta: "Sin evaluar", color: "var(--color-muted)" },
]

/**
 * Stacked bar horizontal con el reparto de niveles de la cohorte.
 * Lectura ejecutiva instantánea de la salud del curso.
 */
export function ResumenCohorte({ resumen, total }: ResumenCohorteProps) {
  if (total === 0) {
    return null
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-subtle p-5">
      <div className="flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="nx-eyebrow text-text-tertiary">Salud agregada de la cohorte</span>
          <span className="text-body-sm text-text-secondary">
            Reparto por nivel cualitativo · {total} colaboradores asignados
          </span>
        </div>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-pill">
        {SEGMENTOS.map((seg) => {
          const valor = resumen.conteoNiveles[seg.key]
          if (valor === 0) {
            return null
          }
          const pct = (valor / total) * 100
          return (
            <div
              key={seg.key}
              style={{ width: `${pct}%`, background: seg.color }}
              aria-label={`${seg.etiqueta}: ${valor} (${Math.round(pct)}%)`}
              title={`${seg.etiqueta}: ${valor} (${Math.round(pct)}%)`}
            />
          )
        })}
      </div>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {SEGMENTOS.map((seg) => {
          const valor = resumen.conteoNiveles[seg.key]
          if (valor === 0) {
            return null
          }
          return (
            <li key={seg.key} className="flex items-center gap-2 text-caption">
              <span
                className="h-2 w-2.5 rounded-sm"
                style={{ background: seg.color }}
                aria-hidden={true}
              />
              <span className="text-text-secondary">{seg.etiqueta}</span>
              <span className="tabular font-medium font-mono text-text-primary">{valor}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
