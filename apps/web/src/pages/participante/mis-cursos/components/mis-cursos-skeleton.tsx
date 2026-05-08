import { Skeleton } from "@/shared/ui/patterns/skeleton"

// Skeleton coherente con layout final: header + filtros + grid 6 cards + kpis.
export function MisCursosSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1200px] flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 py-12 md:py-16">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-14 w-72 md:h-16" />
        <Skeleton className="mt-1 h-5 w-80" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-72 rounded-full" />
      </div>

      <div className="flex flex-col gap-10">
        <SeccionSkeleton />
        <SeccionSkeleton />
      </div>
    </div>
  )
}

function SeccionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-3 w-32" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-glass-border bg-surface-1">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
      </div>
    </div>
  )
}
