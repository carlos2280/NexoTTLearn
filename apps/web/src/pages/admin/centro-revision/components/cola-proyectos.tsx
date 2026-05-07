import { useEntregasProyecto } from "@/features/admin-centro-revision/hooks/use-entregas-proyecto"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { CheckCircle2, FolderOpen } from "lucide-react"
import { ItemColaProyecto } from "./item-cola-proyecto"

interface ColaProyectosProps {
  readonly itemIdSeleccionado: string | null
  readonly onSeleccionar: (id: string) => void
}

export function ColaProyectos({ itemIdSeleccionado, onSeleccionar }: ColaProyectosProps) {
  const { data, isLoading, error } = useEntregasProyecto({ estado: "EN_REVISION" })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no identidad estable
          <Skeleton key={i} className="h-32 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No se pudo cargar la cola"
        description="Intenta recargar la página."
        variant="inline"
      />
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No hay proyectos por revisar"
        description="Cuando lleguen proyectos en revisión aparecerán aquí."
        variant="inline"
      />
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="mb-1 text-text-muted text-xs">
        {data?.total ?? items.length} proyecto{(data?.total ?? 0) !== 1 ? "s" : ""} en revisión
      </p>
      {items.map((item) => (
        <ItemColaProyecto
          key={item.id}
          item={item}
          isSelected={item.id === itemIdSeleccionado}
          onClick={() => onSeleccionar(item.id)}
        />
      ))}
    </div>
  )
}
