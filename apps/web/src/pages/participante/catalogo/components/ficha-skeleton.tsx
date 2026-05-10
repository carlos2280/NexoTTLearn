import { Skeleton } from "@/shared/ui/patterns/skeleton"

export function FichaSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6" aria-busy="true">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-[220px] w-full rounded-[24px]" />
      <Skeleton className="h-12 w-72 rounded-full" />
      <div className="flex flex-col gap-3 rounded-[20px] border border-glass-border bg-surface-1 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex flex-col gap-3 rounded-[20px] border border-glass-border bg-surface-1 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}
