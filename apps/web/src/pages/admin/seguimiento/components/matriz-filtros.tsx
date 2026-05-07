import { FilterPopover } from "@/shared/ui/patterns/filter-popover"
import type { FilterOption } from "@/shared/ui/patterns/filter-popover"
import type { FiltroEstadoSeguimiento } from "@nexott-learn/shared-types"

type EstadoNoAll = Exclude<FiltroEstadoSeguimiento, "all">

const OPCIONES: readonly FilterOption<EstadoNoAll>[] = [
  { value: "Apto", label: "Aptos" },
  { value: "EnRuta", label: "En ruta" },
  { value: "EnRiesgo", label: "En riesgo" },
  { value: "Completado", label: "Completados" },
]

interface MatrizFiltrosProps {
  readonly estado: EstadoNoAll | null
  readonly onChangeEstado: (estado: EstadoNoAll | null) => void
}

export function MatrizFiltros({ estado, onChangeEstado }: MatrizFiltrosProps) {
  const selected: readonly EstadoNoAll[] = estado ? [estado] : []
  const handle = (next: readonly EstadoNoAll[]) => {
    onChangeEstado(next[0] ?? null)
  }
  return (
    <FilterPopover<EstadoNoAll>
      label="Estado"
      options={OPCIONES}
      selected={selected}
      onChange={handle}
      multi={false}
    />
  )
}
