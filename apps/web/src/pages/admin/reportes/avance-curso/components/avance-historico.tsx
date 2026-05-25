import type { EventoHistorico } from "@nexott-learn/shared-types"
import { ArrowRight, Clock } from "lucide-react"

interface AvanceHistoricoProps {
  readonly eventos: readonly EventoHistorico[]
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const REGEX_UNDERSCORE = /_/g
const REGEX_PRIMERA_LETRA = /^\w/

function formatearTipoCambio(tipo: string): string {
  return tipo
    .replace(REGEX_UNDERSCORE, " ")
    .toLowerCase()
    .replace(REGEX_PRIMERA_LETRA, (c) => c.toUpperCase())
}

export function AvanceHistorico({ eventos }: AvanceHistoricoProps) {
  if (eventos.length === 0) {
    return (
      <div className="rounded-2xl border border-border border-dashed bg-canvas px-6 py-12 text-center">
        <p className="text-body-sm text-text-secondary">
          No hay eventos registrados para este curso.
        </p>
      </div>
    )
  }

  return (
    <ol className="flex flex-col">
      {eventos.map((ev, i) => (
        <li key={`${ev.fecha}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
          <div className="relative flex flex-col items-center">
            <span
              aria-hidden={true}
              className="z-10 inline-flex h-7 w-7 items-center justify-center rounded-pill border border-border bg-surface text-text-tertiary"
            >
              <Clock className="h-3.5 w-3.5" />
            </span>
            {i < eventos.length - 1 && (
              <span aria-hidden={true} className="absolute top-7 bottom-0 w-px bg-border" />
            )}
          </div>

          <div className="flex-1 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-body-sm text-text-primary">
                {formatearTipoCambio(ev.tipoCambio)}
              </span>
              <span className="tabular font-mono text-caption text-text-tertiary">
                {formatearFecha(ev.fecha)}
              </span>
            </div>

            {(ev.valorPrev !== null || ev.valorNuevo !== null) && (
              <div className="mt-2 flex items-center gap-2 text-caption text-text-secondary">
                {ev.valorPrev && (
                  <span className="tabular rounded-pill bg-subtle px-2 py-0.5 font-mono">
                    {ev.valorPrev}
                  </span>
                )}
                {ev.valorPrev && ev.valorNuevo && (
                  <ArrowRight className="h-3 w-3 text-text-tertiary" aria-hidden={true} />
                )}
                {ev.valorNuevo && (
                  <span className="tabular rounded-pill bg-accent-soft px-2 py-0.5 font-mono text-accent-on-soft">
                    {ev.valorNuevo}
                  </span>
                )}
              </div>
            )}

            {ev.motivo && <p className="mt-2 text-caption text-text-secondary">{ev.motivo}</p>}

            {ev.autor && <p className="mt-2 text-caption text-text-tertiary">por {ev.autor}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}
