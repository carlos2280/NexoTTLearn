import { Skeleton } from "@/shared/components/ui/skeleton"

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
      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </section>
      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </section>
    </div>
  )
}
