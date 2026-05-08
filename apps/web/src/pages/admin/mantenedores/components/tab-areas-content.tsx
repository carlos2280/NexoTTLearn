import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import type { Area } from "@nexott-learn/shared-types"
import { Layers } from "lucide-react"
import { AreaCard } from "./area-card"

const SKELETON_KEYS = ["a", "b", "c", "d"] as const

interface TabAreasContentProps {
  readonly items: readonly Area[]
  readonly isLoading: boolean
  readonly isError: boolean
  readonly busquedaActiva: boolean
  readonly estadoObsoleta: boolean
  readonly onEditar: (area: Area) => void
  readonly onObsoletar: (area: Area) => void
  readonly onRestaurar: (area: Area) => void
  readonly onEliminar: (area: Area) => void
}

export function TabAreasContent({
  items,
  isLoading,
  isError,
  busquedaActiva,
  estadoObsoleta,
  ...handlers
}: TabAreasContentProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {SKELETON_KEYS.map((k) => (
          <Skeleton key={`sk-${k}`} className="h-24 rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <EmptyState
        icon={Layers}
        title="No se pudo cargar el catálogo"
        description="Reintenta en unos segundos."
      />
    )
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title={emptyTitle(busquedaActiva, estadoObsoleta)}
        description={
          busquedaActiva ? "Ajusta tu búsqueda." : "Crea la primera área del catálogo para empezar."
        }
      />
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((area) => (
        <AreaCard
          key={area.id}
          area={area}
          onEditar={() => handlers.onEditar(area)}
          onObsoletar={() => handlers.onObsoletar(area)}
          onRestaurar={() => handlers.onRestaurar(area)}
          onEliminar={() => handlers.onEliminar(area)}
        />
      ))}
    </div>
  )
}

function emptyTitle(busquedaActiva: boolean, estadoObsoleta: boolean): string {
  if (busquedaActiva) {
    return "Sin resultados"
  }
  return estadoObsoleta ? "No hay áreas obsoletas" : "Aún no hay áreas"
}
