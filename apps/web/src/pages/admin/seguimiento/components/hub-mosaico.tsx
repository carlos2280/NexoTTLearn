import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoListItem } from "@nexott-learn/shared-types"
import { BookOpen, RefreshCw, TrendingUp } from "lucide-react"
import type { CursoHub } from "../lib/ordenar-cursos-hub"
import { TarjetaCursoSeguimiento } from "./tarjeta-curso-seguimiento"

interface HubMosaicoProps {
  readonly items: readonly CursoHub[]
  readonly isLoading: boolean
  readonly isError: boolean
  readonly isLoadingKpis: boolean
  readonly onRetry: () => void
  readonly onAbrir: (cursoId: string) => void
  readonly onIrCursos: () => void
}

export function HubMosaico({
  items,
  isLoading,
  isError,
  isLoadingKpis,
  onRetry,
  onAbrir,
  onIrCursos,
}: HubMosaicoProps) {
  if (isLoading) {
    return <SkeletonGrid />
  }
  if (isError) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No pudimos cargar los cursos"
        description="Reintenta o vuelve más tarde."
        action={
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="size-4" strokeWidth={2} aria-hidden="true" />
            Reintentar
          </Button>
        }
      />
    )
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No hay cursos activos en seguimiento"
        description="Para empezar, publica un curso y úsalo con candidatos."
        action={
          <Button variant="secondary" size="sm" onClick={onIrCursos}>
            Ir a Cursos
          </Button>
        }
      />
    )
  }
  return <Grid items={items} isLoadingKpis={isLoadingKpis} onAbrir={onAbrir} />
}

interface GridProps {
  readonly items: readonly CursoHub[]
  readonly isLoadingKpis: boolean
  readonly onAbrir: (cursoId: string) => void
}

function Grid({ items, isLoadingKpis, onAbrir }: GridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ curso, kpis }: { curso: CursoListItem; kpis: CursoHub["kpis"] }) => (
        <TarjetaCursoSeguimiento
          key={curso.id}
          curso={curso}
          kpis={kpis}
          isLoadingKpis={isLoadingKpis}
          onAbrir={onAbrir}
        />
      ))}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-[var(--radius-lg)]" />
      ))}
    </div>
  )
}
