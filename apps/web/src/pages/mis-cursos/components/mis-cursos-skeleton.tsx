import { Skeleton } from "@/shared/components/ui/skeleton"

export function MisCursosSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}
