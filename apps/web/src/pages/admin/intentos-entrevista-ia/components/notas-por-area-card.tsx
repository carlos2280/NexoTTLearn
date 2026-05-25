import type { AreaResponse, IntentoEntrevistaIaAdminResponse } from "@nexott-learn/shared-types"

interface NotasPorAreaCardProps {
  readonly notasPorArea: IntentoEntrevistaIaAdminResponse["notasPorArea"]
  readonly areas: readonly AreaResponse[]
}

/**
 * Desglose de la nota global por area evaluada (rubrica). Muestra el nombre
 * del area + nota + barra horizontal proporcional. Si el lookup de area
 * falla (caso raro: area renombrada/borrada) cae a "Area #id-corto".
 */
export function NotasPorAreaCard({ notasPorArea, areas }: NotasPorAreaCardProps) {
  if (notasPorArea.length === 0) {
    return null
  }
  const areaPorId = new Map(areas.map((a) => [a.id, a.nombre]))
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Rubrica</span>
        <h2 className="text-h3 text-text-primary">Desglose por area</h2>
      </header>
      <ul className="flex flex-col gap-3">
        {notasPorArea.map((n) => {
          const nombre = areaPorId.get(n.areaId) ?? `Area #${n.areaId.slice(0, 6)}`
          return <FilaArea key={n.areaId} nombre={nombre} nota={n.nota} />
        })}
      </ul>
    </section>
  )
}

interface FilaAreaProps {
  readonly nombre: string
  readonly nota: number
}

function FilaArea({ nombre, nota }: FilaAreaProps) {
  const pct = Math.min(100, Math.max(0, nota))
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-sm text-text-primary">{nombre}</span>
        <span className="tabular font-mono text-body-sm text-text-secondary">
          {nota.toFixed(1)}
          <span className="text-text-disabled"> / 100</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-subtle">
        <div
          className="h-full rounded-pill bg-accent transition-all duration-base ease-default"
          style={{ width: `${pct}%` }}
          aria-hidden={true}
        />
      </div>
    </li>
  )
}
