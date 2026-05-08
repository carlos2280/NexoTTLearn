import { useAreas } from "@/features/admin-areas/hooks/use-areas"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { SearchInput } from "@/shared/ui/patterns/search-input"
import { SegmentedControl, type SegmentedOption } from "@/shared/ui/patterns/segmented-control"
import { Toolbar } from "@/shared/ui/patterns/toolbar"
import { Button } from "@/shared/ui/primitives/button"
import type { Area, EstadoArea } from "@nexott-learn/shared-types"
import { Lock, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useAccionesArea } from "../hooks/use-acciones-area"
import { DialogCrearArea } from "./dialog-crear-area"
import { DialogEditarArea } from "./dialog-editar-area"
import { TabAreasConfirm } from "./tab-areas-confirm"
import { TabAreasContent } from "./tab-areas-content"

type FiltroEstadoArea = "ACTIVA" | "OBSOLETA"

const ESTADO_OPTIONS: readonly SegmentedOption<FiltroEstadoArea>[] = [
  { value: "ACTIVA", label: "Activas" },
  { value: "OBSOLETA", label: "Obsoletas" },
]

const DEBOUNCE_MS = 250

export function TabAreas() {
  const [estado, setEstado] = useState<FiltroEstadoArea>("ACTIVA")
  const [busqueda, setBusqueda] = useState("")
  const [busquedaDebounced, setBusquedaDebounced] = useState("")
  const [crearOpen, setCrearOpen] = useState(false)
  const [editarTarget, setEditarTarget] = useState<Area | undefined>()
  const acciones = useAccionesArea()

  useEffect(() => {
    const t = window.setTimeout(() => setBusquedaDebounced(busqueda.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [busqueda])

  const { data, isLoading, isError, error } = useAreas({
    estado: estado satisfies EstadoArea,
    q: busquedaDebounced || undefined,
    pageSize: 100,
  })
  const items = data?.items ?? []

  if (error instanceof ApiError && error.status === 403) {
    return (
      <EmptyState
        icon={Lock}
        title="Acceso restringido"
        description="Tu cuenta no tiene permisos para gestionar áreas."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <Toolbar
        search={
          <SearchInput
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar área..."
            aria-label="Buscar áreas"
          />
        }
        filters={
          <SegmentedControl<FiltroEstadoArea>
            value={estado}
            onChange={setEstado}
            options={ESTADO_OPTIONS}
            ariaLabel="Filtrar áreas por estado"
            size="sm"
          />
        }
        trailing={
          <Button onClick={() => setCrearOpen(true)}>
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Nueva área
          </Button>
        }
      />

      <TabAreasContent
        items={items}
        isLoading={isLoading}
        isError={isError}
        busquedaActiva={busquedaDebounced.length > 0}
        estadoObsoleta={estado === "OBSOLETA"}
        onEditar={setEditarTarget}
        onObsoletar={(a) => acciones.request("eliminar", a)}
        onRestaurar={(a) => acciones.request("restaurar", a)}
        onEliminar={(a) => acciones.request("eliminar", a)}
      />

      <DialogCrearArea open={crearOpen} onOpenChange={setCrearOpen} />
      <DialogEditarArea
        open={editarTarget !== undefined}
        onOpenChange={(o) => !o && setEditarTarget(undefined)}
        area={editarTarget}
      />

      <TabAreasConfirm acciones={acciones} />
    </div>
  )
}
