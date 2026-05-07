import { useEntregasBloque } from "@/features/admin-centro-revision/hooks/use-entregas-bloque"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { CheckCircle2, InboxIcon } from "lucide-react"
import { ordenarEntregasBloque } from "../lib/prioridad"
import { ItemColaEntrega } from "./item-cola-entrega"

interface ColaEntregasProps {
  readonly itemIdSeleccionado: string | null
  readonly onSeleccionar: (id: string) => void
}

export function ColaEntregas({ itemIdSeleccionado, onSeleccionar }: ColaEntregasProps) {
  const { data, isLoading, error } = useEntregasBloque({ estado: "PENDIENTE_REVISION" })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no identidad estable
          <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No se pudo cargar la cola"
        description="Intenta recargar la página."
        variant="inline"
      />
    )
  }

  const items = ordenarEntregasBloque(data?.items ?? [])

  if (items.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No hay entregas por revisar"
        description="Buen trabajo. Cuando lleguen nuevas entregas pendientes aparecerán aquí."
        variant="inline"
      />
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <p className="mb-1 text-text-muted text-xs">
        {data?.total ?? items.length} entrega{(data?.total ?? 0) !== 1 ? "s" : ""} pendiente
        {(data?.total ?? 0) !== 1 ? "s" : ""}
      </p>
      {items.map((item) => (
        <ItemColaEntrega
          key={item.id}
          item={item}
          isSelected={item.id === itemIdSeleccionado}
          onClick={() => onSeleccionar(item.id)}
        />
      ))}
    </div>
  )
}
