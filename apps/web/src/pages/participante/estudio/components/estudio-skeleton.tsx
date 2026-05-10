import { Skeleton } from "@/shared/ui/patterns/skeleton"

const SECCIONES_SKELETON_KEYS = ["sec-a", "sec-b", "sec-c"] as const

// Skeleton del modo inmersivo: predice el layout final (mini-header + sidebar
// + canvas + dock) para reducir CLS y dar continuidad visual mientras llega
// la respuesta del back. NO es generico — refleja exactamente la composicion.

export function EstudioSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-surface-0">
      <div className="flex h-header-inmersivo items-center gap-4 border-glass-border border-b px-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-1.5 w-32 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-sidebar-inmersivo shrink-0 flex-col border-glass-border border-r px-4 py-4">
          <Skeleton className="mb-4 h-3 w-20" />
          <div className="flex flex-col gap-2">
            {SECCIONES_SKELETON_KEYS.map((key) => (
              <SidebarSeccionSkeleton key={key} />
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-reading flex-col gap-8 px-10 py-12">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-9 w-3/4" />
            </div>
            <div className="flex flex-col gap-3 border-glass-border border-b pb-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-3 w-32" />
            </div>
            <BloqueSkeleton />
            <BloqueSkeleton />
          </div>
        </main>
      </div>

      <div className="flex h-dock-inmersivo items-center gap-4 border-glass-border border-t px-6">
        <Skeleton className="h-1.5 w-72 rounded-full" />
        <Skeleton className="ml-auto h-8 w-40 rounded-md" />
      </div>
    </div>
  )
}

function SidebarSeccionSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 px-2 py-2">
        <Skeleton className="size-3.5 rounded-sm" />
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3.5 flex-1" />
      </div>
      <div className="ml-6 flex flex-col gap-1 border-glass-border border-l pl-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

function BloqueSkeleton() {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass-1 p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-20 rounded-full" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[95%]" />
        <Skeleton className="h-3 w-[88%]" />
        <Skeleton className="h-3 w-[60%]" />
      </div>
    </div>
  )
}
