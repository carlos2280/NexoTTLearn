import type { useMatrizSeguimiento } from "@/features/admin-seguimiento/hooks/use-matriz-seguimiento"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Button } from "@/shared/ui/primitives/button"
import type { MatrizAreaHeader, MatrizCursoResponse, MatrizFila } from "@nexott-learn/shared-types"
import { RefreshCw, Users } from "lucide-react"
import { MatrizTabla } from "./matriz-tabla"

interface MatrizCuerpoProps {
  readonly query: ReturnType<typeof useMatrizSeguimiento>
  readonly filas: MatrizCursoResponse["filas"]
  readonly onClickCelda: (fila: MatrizFila, area: MatrizAreaHeader) => void
  readonly onClickFila: (participanteId: string) => void
  readonly onClickHeaderArea: (area: MatrizAreaHeader) => void
}

export function MatrizCuerpo({
  query,
  filas,
  onClickCelda,
  onClickFila,
  onClickHeaderArea,
}: MatrizCuerpoProps) {
  if (query.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
  }
  if (query.isError || !query.data) {
    return (
      <EmptyState
        icon={Users}
        title="No pudimos cargar la matriz"
        description="Reintenta o vuelve más tarde."
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              query.refetch()
            }}
          >
            <RefreshCw className="size-4" strokeWidth={2} aria-hidden="true" />
            Reintentar
          </Button>
        }
      />
    )
  }
  if (filas.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin candidatos para mostrar"
        description="Ajusta los filtros o invita candidatos al curso."
      />
    )
  }
  return (
    <MatrizTabla
      matriz={{ ...query.data, filas }}
      onClickCelda={onClickCelda}
      onClickFila={onClickFila}
      onClickHeaderArea={onClickHeaderArea}
    />
  )
}

export function filtrarBusqueda(data: MatrizCursoResponse | undefined, search: string) {
  if (!data) {
    return []
  }
  const q = search.trim().toLowerCase()
  if (!q) {
    return data.filas
  }
  return data.filas.filter((f) => {
    const nombre = `${f.participante.nombre} ${f.participante.apellido}`.toLowerCase()
    return nombre.includes(q) || f.participante.email.toLowerCase().includes(q)
  })
}
