import { Skeleton } from "@/shared/ui/patterns/skeleton"

// Skeleton coherente con layout final: header + filtros + grid 6 cards.
export function CatalogoSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1200px] flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 py-12 md:py-16">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-14 w-64 md:h-16" />
        <Skeleton className="mt-1 h-5 w-80" />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-glass-border border-b pb-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-[20px] border border-glass-border bg-surface-1 p-0">
      <Skeleton className="h-[180px] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-2 flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}
