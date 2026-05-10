import { Badge } from "@/shared/ui/patterns/badge"
import type { CeldaInicialDetalle } from "@nexott-learn/shared-types"
import { CalendarClock, Compass } from "lucide-react"
import type { ReactNode } from "react"

interface DrawerCeldaInicialProps {
  readonly detalle: CeldaInicialDetalle
}

export function DrawerCeldaInicial({ detalle }: DrawerCeldaInicialProps) {
  const { nota, observaciones, capturadaPor, capturadaAt, asignacionConfirmada } = detalle

  return (
    <div className="flex flex-col gap-5">
      <Bloque titulo="Evaluación inicial">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-3xl text-text-primary tabular-nums">
            {nota === null ? "—" : Math.round(nota)}
          </span>
          <span className="text-sm text-text-muted">/ 100</span>
        </div>
        {capturadaPor && capturadaAt ? (
          <p className="flex items-center gap-1.5 text-text-muted text-xs">
            <CalendarClock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Capturada por {capturadaPor.nombre} {capturadaPor.apellido} ·{" "}
            {new Date(capturadaAt).toLocaleDateString("es-CL")}
          </p>
        ) : (
          <p className="text-text-muted text-xs">Sin captura registrada.</p>
        )}
      </Bloque>

      <Bloque titulo="Observaciones del diagnóstico">
        <p className="text-sm text-text-secondary leading-relaxed">
          {observaciones?.trim() || "Sin observaciones registradas."}
        </p>
      </Bloque>

      <Bloque titulo="Asignación al curso">
        <div className="flex items-center gap-2 text-sm">
          <Compass className="size-4 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
          {asignacionConfirmada ? (
            <Badge tone="violet" size="sm">
              {asignacionConfirmada}
            </Badge>
          ) : (
            <span className="text-text-muted">Sin asignación confirmada</span>
          )}
        </div>
      </Bloque>
    </div>
  )
}

function Bloque({ titulo, children }: { readonly titulo: string; readonly children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="font-medium text-text-secondary text-xs uppercase tracking-wider">{titulo}</h4>
      {children}
    </section>
  )
}
