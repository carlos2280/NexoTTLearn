import { Skeleton } from "@/shared/components/ui/skeleton"

/**
 * Skeleton de los 3 bloques nuevos de la bandeja: hero del siguiente paso
 * + grilla de cursos activos + card de "tu camino".
 */
export function BandejaSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5">
        <Skeleton className="h-10 w-3/4 max-w-2xl" />
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full max-w-prose" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-11 w-44 rounded-pill" />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </section>
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/3" />
      </section>
    </div>
  )
}
