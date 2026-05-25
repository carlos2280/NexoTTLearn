import { Card } from "@/shared/components/ui/card"
import type { ObservacionFrecuente } from "@nexott-learn/shared-types"
import { MessageSquare } from "lucide-react"

interface EficaciaObservacionesProps {
  readonly observaciones: readonly ObservacionFrecuente[]
}

export function EficaciaObservaciones({ observaciones }: EficaciaObservacionesProps) {
  if (observaciones.length === 0) {
    return null
  }

  const maxCasos = Math.max(...observaciones.map((o) => o.casos))

  return (
    <Card tono="plano" densidad="generosa" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Motivos recurrentes</span>
        <h2 className="text-h3 text-text-primary">Observaciones frecuentes</h2>
        <p className="text-body-sm text-text-secondary">
          Las razones más repetidas detrás de los no-aptos y los aptos que no pasaron.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {observaciones.map((obs, i) => {
          const peso = maxCasos > 0 ? obs.casos / maxCasos : 0
          return (
            <li
              key={`${i}-${obs.texto}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="text-body-sm text-text-primary">{obs.texto}</span>
                <div className="h-1 w-full overflow-hidden rounded-pill bg-subtle">
                  <div
                    className="h-full rounded-pill bg-accent/40"
                    style={{ width: `${Math.round(peso * 100)}%` }}
                    aria-hidden={true}
                  />
                </div>
              </div>
              <span className="tabular shrink-0 font-medium font-mono text-body-sm text-text-secondary">
                {obs.casos}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
