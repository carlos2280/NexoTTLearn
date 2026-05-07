import { Card } from "@/shared/ui/primitives/card"
import type { MatrizAreaHeader, MatrizCursoResponse, MatrizFila } from "@nexott-learn/shared-types"
import { FilaCandidato } from "./fila-candidato"

interface MatrizTablaProps {
  readonly matriz: MatrizCursoResponse
  readonly onClickCelda: (fila: MatrizFila, area: MatrizAreaHeader) => void
  readonly onClickFila: (participanteId: string) => void
  readonly onClickHeaderArea: (area: MatrizAreaHeader) => void
}

export function MatrizTabla({
  matriz,
  onClickCelda,
  onClickFila,
  onClickHeaderArea,
}: MatrizTablaProps) {
  return (
    <Card variant="glass" padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-glass-1">
              <th
                scope="col"
                className="sticky left-0 z-20 min-w-[14rem] bg-glass-1 px-3 py-2.5 text-left font-medium text-text-secondary text-xs uppercase tracking-wider"
              >
                Candidato
              </th>
              {matriz.areas.map((area) => (
                <th
                  key={area.id}
                  scope="col"
                  className="min-w-[5rem] px-1.5 py-2.5 text-center font-medium text-text-secondary text-xs uppercase tracking-wider"
                >
                  <button
                    type="button"
                    onClick={() => onClickHeaderArea(area)}
                    className="flex w-full flex-col items-center gap-0.5 rounded-[var(--radius-sm)] px-1 py-1 hover:bg-glass-2 hover:text-text-primary"
                    title={`Umbral ${area.umbral}`}
                  >
                    <span className="truncate">{area.nombre}</span>
                    <span className="text-[10px] text-text-muted">u.{area.umbral}</span>
                  </button>
                </th>
              ))}
              <th
                scope="col"
                className="px-3 py-2.5 text-center font-medium text-text-secondary text-xs uppercase tracking-wider"
              >
                Cobertura
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-center font-medium text-text-secondary text-xs uppercase tracking-wider"
              >
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {matriz.filas.map((fila) => (
              <FilaCandidato
                key={fila.inscripcionId}
                fila={fila}
                areas={matriz.areas}
                onClickCelda={(area) => onClickCelda(fila, area)}
                onClickFila={() => onClickFila(fila.participante.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
