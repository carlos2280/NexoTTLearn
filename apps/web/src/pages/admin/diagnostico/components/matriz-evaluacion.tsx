import { cn } from "@/shared/lib/cn"
import type {
  MatrizDiagnosticoArea,
  MatrizDiagnosticoFila,
  SemaforoCeldaDiagnostico,
} from "@nexott-learn/shared-types"
import { Pencil } from "lucide-react"

interface MatrizEvaluacionProps {
  readonly areas: readonly MatrizDiagnosticoArea[]
  readonly filas: readonly MatrizDiagnosticoFila[]
  readonly onCeldaClick?: (inscripcionId: string, areaId: string) => void
}

export function MatrizEvaluacion({ areas, filas, onCeldaClick }: MatrizEvaluacionProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[var(--radius-xl)]",
        "border border-glass-border bg-glass-1 backdrop-blur-2xl",
      )}
    >
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface-1/80 px-4 py-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider">
              Candidato
            </th>
            {areas.map((area) => (
              <th
                key={area.id}
                className="px-3 py-3 text-center font-medium text-text-muted text-xs uppercase tracking-wider"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{area.nombre}</span>
                  <span className="text-[10px] text-text-faint normal-case tracking-normal">
                    objetivo {area.puntajeObjetivo}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <FilaMatriz
              key={fila.inscripcionId}
              fila={fila}
              areas={areas}
              onCeldaClick={onCeldaClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FilaMatriz({
  fila,
  areas,
  onCeldaClick,
}: {
  readonly fila: MatrizDiagnosticoFila
  readonly areas: readonly MatrizDiagnosticoArea[]
  readonly onCeldaClick?: (inscripcionId: string, areaId: string) => void
}) {
  return (
    <tr className="border-glass-border border-t">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-surface-1/80 px-4 py-2.5 text-left font-medium text-sm text-text-primary"
      >
        <div className="flex flex-col">
          <span>
            {fila.participante.nombre} {fila.participante.apellido}
          </span>
          <span className="text-[11px] text-text-muted">
            {fila.cobertura.capturadas}/{fila.cobertura.total} áreas
          </span>
        </div>
      </th>
      {areas.map((area) => {
        const celda = fila.celdas.find((c) => c.areaId === area.id)
        return (
          <td key={area.id} className="border-glass-border border-l p-1.5 text-center">
            <Celda
              nota={celda?.nota ?? null}
              semaforo={celda?.semaforo ?? "vacio"}
              onClick={onCeldaClick ? () => onCeldaClick(fila.inscripcionId, area.id) : undefined}
            />
          </td>
        )
      })}
    </tr>
  )
}

function Celda({
  nota,
  semaforo,
  onClick,
}: {
  readonly nota: number | null
  readonly semaforo: SemaforoCeldaDiagnostico
  readonly onClick?: () => void
}) {
  const className = cn(
    "inline-flex h-9 w-full min-w-[56px] items-center justify-center",
    "rounded-[var(--radius-sm)] font-medium text-sm",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
    onClick ? "cursor-pointer" : "cursor-default",
    semaforo === "verde" && "bg-success/15 text-success hover:bg-success/25",
    semaforo === "amarillo" && "bg-warning/15 text-warning hover:bg-warning/25",
    semaforo === "rojo" && "bg-danger/15 text-danger hover:bg-danger/25",
    semaforo === "vacio" && "bg-glass-2 text-text-muted hover:bg-glass-3",
  )
  if (!onClick) {
    return (
      <span className={className} aria-label={nota === null ? "Sin captura" : `Nota ${nota}`}>
        {nota ?? <Pencil className="size-3.5" aria-hidden="true" />}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={nota === null ? "Capturar nota" : `Editar nota ${nota}`}
    >
      {nota ?? <Pencil className="size-3.5" aria-hidden="true" />}
    </button>
  )
}
