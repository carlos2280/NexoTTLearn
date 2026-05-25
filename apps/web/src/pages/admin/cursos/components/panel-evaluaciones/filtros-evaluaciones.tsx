import { SearchField } from "@/shared/components/ui/search-field"
import { X } from "lucide-react"
import type { ReactNode } from "react"
import {
  FILTROS_EVALUACIONES_INICIAL,
  type FiltroAprobadoUi,
  type FiltrosEvaluacionesValor,
  type OpcionEstado,
} from "./filtros-evaluaciones.types"
import { FiltrosPopover } from "./filtros-popover"

interface FiltrosEvaluacionesProps {
  readonly valor: FiltrosEvaluacionesValor
  readonly opcionesEstado: readonly OpcionEstado[]
  readonly onCambio: (siguiente: FiltrosEvaluacionesValor) => void
}

const ETIQUETA_APROBADO_CHIP: ReadonlyMap<FiltroAprobadoUi, string> = new Map([
  ["SI", "Aprobados"],
  ["NO", "No aprobados"],
  ["PENDIENTE", "Pendiente de calificar"],
])

/**
 * Search + popover de filtros para las tablas de evaluaciones del curso.
 * Chips debajo muestran los filtros aplicados con boton para quitarlos.
 */
export function FiltrosEvaluaciones({ valor, opcionesEstado, onCambio }: FiltrosEvaluacionesProps) {
  const chips: ReactNode[] = []
  if (valor.estado !== "TODOS") {
    const etiqueta = opcionesEstado.find((o) => o.value === valor.estado)?.etiqueta ?? valor.estado
    chips.push(
      <ChipFiltro
        key="estado"
        etiqueta={`Estado: ${etiqueta}`}
        onLimpiar={() => onCambio({ ...valor, estado: "TODOS" })}
      />,
    )
  }
  const etiquetaAprobado = ETIQUETA_APROBADO_CHIP.get(valor.aprobado)
  if (valor.aprobado !== "TODOS" && etiquetaAprobado !== undefined) {
    chips.push(
      <ChipFiltro
        key="aprobado"
        etiqueta={etiquetaAprobado}
        onLimpiar={() => onCambio({ ...valor, aprobado: "TODOS" })}
      />,
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          valor={valor.busqueda}
          onCambio={(v) => onCambio({ ...valor, busqueda: v })}
          placeholder="Buscar por nombre o email…"
        />
        <FiltrosPopover valor={valor} opcionesEstado={opcionesEstado} onCambio={onCambio} />
        {chips.length > 0 ? (
          <button
            type="button"
            onClick={() => onCambio({ ...FILTROS_EVALUACIONES_INICIAL, busqueda: valor.busqueda })}
            className="ml-1 text-caption text-text-tertiary transition-colors hover:text-text-primary"
          >
            Limpiar
          </button>
        ) : null}
      </div>
      {chips.length > 0 ? <div className="flex flex-wrap gap-2">{chips}</div> : null}
    </div>
  )
}

interface ChipFiltroProps {
  readonly etiqueta: string
  readonly onLimpiar: () => void
}

function ChipFiltro({ etiqueta, onLimpiar }: ChipFiltroProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill border border-border bg-subtle px-2.5 py-0.5 text-caption text-text-secondary">
      {etiqueta}
      <button
        type="button"
        onClick={onLimpiar}
        aria-label={`Quitar filtro ${etiqueta}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-border hover:text-text-primary"
      >
        <X className="h-3 w-3" aria-hidden={true} />
      </button>
    </span>
  )
}
