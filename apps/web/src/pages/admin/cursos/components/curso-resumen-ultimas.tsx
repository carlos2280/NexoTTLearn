import { BadgeEstadoAsignacion } from "@/pages/admin/asignaciones/components/badge-estado-asignacion"
import { Card } from "@/shared/components/ui/card"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { Asignacion } from "@nexott-learn/shared-types"

interface CursoResumenUltimasProps {
  readonly asignaciones: readonly Asignacion[]
  readonly max?: number
  readonly tieneEntregaACliente: boolean
}

function fechaAbsoluta(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })
}

export function CursoResumenUltimas({
  asignaciones,
  max = 5,
  tieneEntregaACliente,
}: CursoResumenUltimasProps) {
  const ultimas = [...asignaciones]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, max)

  return (
    <Card tono="plano" className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h3 className="text-h3 text-text-primary">Últimas actualizaciones</h3>
        <span className="text-caption text-text-tertiary">ordenadas por cambio reciente</span>
      </header>

      {ultimas.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Sin movimientos. Asigna a alguien para empezar.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {ultimas.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-body-sm text-text-primary">
                  {a.colaborador.nombreCompleto}
                </span>
                <span className="truncate text-caption text-text-tertiary">
                  {a.colaborador.email}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <BadgeEstadoAsignacion asignacion={a} tieneEntregaACliente={tieneEntregaACliente} />
                <time
                  dateTime={a.updatedAt}
                  title={fechaAbsoluta(a.updatedAt)}
                  className="tabular text-caption text-text-tertiary"
                >
                  {tiempoRelativo(a.updatedAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
