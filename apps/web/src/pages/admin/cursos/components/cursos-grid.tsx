import { Skeleton } from "@/shared/ui/patterns/skeleton"
import type { CursoListItem } from "@nexott-learn/shared-types"
import { CursoCard } from "./curso-card"

interface CoursesGridProps {
  readonly items: readonly CursoListItem[]
  readonly onOpen: (curso: CursoListItem) => void
  readonly onEdit: (curso: CursoListItem) => void
  readonly onDuplicate: (curso: CursoListItem) => void
  readonly onSeguimiento: (curso: CursoListItem) => void
  readonly onCandidatos: (curso: CursoListItem) => void
  readonly onUnpublish: (curso: CursoListItem) => void
  readonly onClose: (curso: CursoListItem) => void
  readonly onDelete: (curso: CursoListItem) => void
}

const GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"

export function CursosGrid({
  items,
  onOpen,
  onEdit,
  onDuplicate,
  onSeguimiento,
  onCandidatos,
  onUnpublish,
  onClose,
  onDelete,
}: CoursesGridProps) {
  return (
    <div className={GRID_CLASS}>
      {items.map((curso, index) => (
        <CursoCard
          key={curso.id}
          curso={curso}
          index={index}
          onOpen={onOpen}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onSeguimiento={onSeguimiento}
          onCandidatos={onCandidatos}
          onUnpublish={onUnpublish}
          onClose={onClose}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export function CursosGridSkeleton({ count = 6 }: { readonly count?: number }) {
  return (
    <div className={GRID_CLASS} aria-busy={true} aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="flex h-[260px] flex-col gap-4 rounded-[var(--radius-xl)] border border-glass-border bg-glass-1 p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-[var(--radius-md)]" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
      <div className="grid grid-cols-3 gap-2 border-glass-border border-t pt-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}
