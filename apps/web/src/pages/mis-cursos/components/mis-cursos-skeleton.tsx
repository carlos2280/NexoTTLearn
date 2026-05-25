import { Skeleton } from "@/shared/components/ui/skeleton"

export function MisCursosSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton fijo sin reordenacion
          key={i}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <Skeleton className="h-6 w-24 rounded-pill" />
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-1 w-full" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-7 w-20 rounded-pill" />
          </div>
        </div>
      ))}
    </div>
  )
}
