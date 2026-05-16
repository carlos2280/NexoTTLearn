import { Skeleton } from "@/shared/components/ui/skeleton"

/**
 * Skeleton del modo inmersivo a pantalla completa. Mismo layout 3 columnas
 * que la página real para evitar saltos al cargar.
 */
export function CursoInmersivoSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <div className="flex items-center gap-4 border-border border-b bg-surface px-6 py-3">
        <Skeleton className="h-7 w-20 rounded-pill" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="ml-auto hidden h-2 w-44 rounded-pill sm:block" />
      </div>
      <div className="grid flex-1 grid-cols-[280px_minmax(0,1fr)_320px] overflow-hidden">
        <aside className="flex flex-col gap-4 border-border border-r bg-subtle p-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
        </aside>
        <main className="flex flex-col gap-4 px-8 py-10">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-2/3 max-w-2xl" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-4 h-44 w-full rounded-2xl" />
        </main>
        <aside className="flex flex-col gap-5 border-border border-l bg-surface p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </aside>
      </div>
    </div>
  )
}
