import { configEstadoSeguimiento } from "@/features/admin-seguimiento/lib/estado-seguimiento"
import { Badge } from "@/shared/ui/patterns/badge"
import { Avatar } from "@/shared/ui/primitives/avatar"
import type { MatrizAreaHeader, MatrizFila } from "@nexott-learn/shared-types"
import { CeldaSemaforo } from "./celda-semaforo"

interface FilaCandidatoProps {
  readonly fila: MatrizFila
  readonly areas: readonly MatrizAreaHeader[]
  readonly onClickCelda: (area: MatrizAreaHeader) => void
  readonly onClickFila: () => void
}

export function FilaCandidato({ fila, areas, onClickCelda, onClickFila }: FilaCandidatoProps) {
  const cfg = configEstadoSeguimiento(fila.estadoSeguimiento)
  const cobertura = Math.round(fila.cobertura)
  const initials = `${fila.participante.nombre.charAt(0)}${fila.participante.apellido.charAt(0)}`

  return (
    <tr className="border-glass-border border-b last:border-0 hover:bg-glass-1">
      <th scope="row" className="sticky left-0 z-10 min-w-[14rem] bg-surface-0 px-3 py-2 text-left">
        <button
          type="button"
          onClick={onClickFila}
          className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-1 py-1 text-left hover:bg-glass-2"
        >
          <Avatar size="sm" initials={initials} alt={fila.participante.nombre} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-sm text-text-primary">
              {fila.participante.nombre} {fila.participante.apellido}
            </span>
            <span className="truncate text-text-muted text-xs">{fila.participante.email}</span>
          </span>
        </button>
      </th>
      {areas.map((area) => {
        const celda = fila.celdas.find((c) => c.areaId === area.id)
        if (!celda) {
          return (
            <td key={area.id} className="px-1.5 py-2 text-center">
              <span className="text-text-muted text-xs">—</span>
            </td>
          )
        }
        return (
          <td key={area.id} className="px-1.5 py-2 text-center align-middle">
            <CeldaSemaforo celda={celda} umbral={area.umbral} onClick={() => onClickCelda(area)} />
          </td>
        )
      })}
      <td className="px-3 py-2 text-center text-sm tabular-nums">{cobertura}%</td>
      <td className="px-3 py-2 text-center">
        <Badge tone={cfg.tone} size="sm" dot={true}>
          {cfg.label}
        </Badge>
      </td>
    </tr>
  )
}
