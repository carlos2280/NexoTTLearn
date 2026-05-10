import { SearchInput } from "@/shared/ui/patterns/search-input"
import { Toolbar } from "@/shared/ui/patterns/toolbar"
import type { FiltroEstadoSeguimiento } from "@nexott-learn/shared-types"
import { MatrizFiltros } from "./matriz-filtros"

type EstadoNoAll = Exclude<FiltroEstadoSeguimiento, "all">

interface MatrizToolbarProps {
  readonly search: string
  readonly onChangeSearch: (next: string) => void
  readonly estado: EstadoNoAll | null
  readonly onChangeEstado: (next: EstadoNoAll | null) => void
}

export function MatrizToolbar({
  search,
  onChangeSearch,
  estado,
  onChangeEstado,
}: MatrizToolbarProps) {
  return (
    <Toolbar
      search={
        <SearchInput
          value={search}
          onChange={onChangeSearch}
          placeholder="Buscar candidato..."
          globalShortcut={true}
          inputSize="sm"
        />
      }
      filters={<MatrizFiltros estado={estado} onChangeEstado={onChangeEstado} />}
    />
  )
}
