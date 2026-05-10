import { Skeleton } from "@/shared/ui/patterns/skeleton"

// Skeleton coherente con layout final: breadcrumb + hero rico + areas + hitos.
export function VistaCursoSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-[1080px] flex-col gap-8"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-4 w-56" />

      <div className="flex flex-col gap-6 rounded-3xl border border-glass-border bg-surface-1 p-6 md:flex-row md:p-8">
        <Skeleton className="size-[240px] shrink-0 rounded-3xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-3 w-40" />
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <Skeleton className="h-3 w-72" />
            {[0, 1].map((j) => (
              <Skeleton key={j} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
