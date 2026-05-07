import { Badge } from "@/shared/ui/patterns/badge"
import type { CeldaActualDetalle, CeldaActualModulo } from "@nexott-learn/shared-types"
import { AlertTriangle, BookOpen } from "lucide-react"
import type { ReactNode } from "react"
import { type EntregaAjustable, FilaEntregaReciente } from "./fila-entrega-reciente"

interface DrawerCeldaActualProps {
  readonly detalle: CeldaActualDetalle
  readonly onAjustarEntrega: (e: EntregaAjustable) => void
}

export function DrawerCeldaActual({ detalle, onAjustarEntrega }: DrawerCeldaActualProps) {
  return (
    <div className="flex flex-col gap-5">
      <Bloque titulo="Nota actual del área">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-3xl text-text-primary tabular-nums">
            {detalle.notaArea === null ? "—" : Math.round(detalle.notaArea)}
          </span>
          <span className="text-sm text-text-muted">/ 100</span>
        </div>
      </Bloque>

      {detalle.alertas.length > 0 ? (
        <Bloque titulo="Alertas">
          <ul className="flex flex-col gap-1.5">
            {detalle.alertas.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-warning leading-relaxed">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {a}
              </li>
            ))}
          </ul>
        </Bloque>
      ) : null}

      <Bloque titulo={`Módulos del área (${detalle.modulosArea.length})`}>
        {detalle.modulosArea.length === 0 ? (
          <p className="text-text-muted text-xs">Sin módulos asignados al área.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {detalle.modulosArea.map((m) => (
              <ModuloFila key={m.id} modulo={m} />
            ))}
          </ul>
        )}
      </Bloque>

      <Bloque titulo={`Entregas recientes (${detalle.entregasRecientes.length})`}>
        {detalle.entregasRecientes.length === 0 ? (
          <p className="text-text-muted text-xs">Sin entregas registradas todavía.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {detalle.entregasRecientes.map((e) => (
              <FilaEntregaReciente key={e.id} entrega={e} onAjustar={onAjustarEntrega} />
            ))}
          </ul>
        )}
      </Bloque>
    </div>
  )
}

function ModuloFila({ modulo }: { readonly modulo: CeldaActualModulo }) {
  const tone =
    modulo.estado === "COMPLETADO"
      ? "success"
      : modulo.estado === "EN_PROGRESO"
        ? "info"
        : "neutral"
  return (
    <li className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-3 py-2 text-sm">
      <span className="flex min-w-0 items-center gap-2 text-text-secondary">
        <BookOpen className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span className="truncate">{modulo.titulo}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge tone={tone} size="sm">
          {modulo.estado.replaceAll("_", " ").toLowerCase()}
        </Badge>
        <span className="font-semibold tabular-nums">
          {modulo.nota === null ? "—" : Math.round(modulo.nota)}
        </span>
      </span>
    </li>
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
