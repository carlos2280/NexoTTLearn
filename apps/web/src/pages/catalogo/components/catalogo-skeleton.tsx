/**
 * Skeleton de cards del catalogo de voluntariado. 6 placeholders que respetan
 * el aspect ratio aproximado de `CatalogoCard` para que el shift de layout sea
 * minimo cuando llegan los datos reales.
 */
export function CatalogoSkeleton() {
  return (
    <div
      aria-busy={true}
      aria-label="Cargando catalogo de cursos"
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton estatico, sin reorden.
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
        >
          <div className="h-28 animate-pulse bg-subtle" />
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-20 animate-pulse rounded-pill bg-subtle" />
              <div className="h-5 w-3/4 animate-pulse rounded-md bg-subtle" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-pill bg-subtle" />
              <div className="h-6 w-16 animate-pulse rounded-pill bg-subtle" />
            </div>
            <div className="mt-2 h-10 animate-pulse rounded-pill bg-subtle" />
          </div>
        </div>
      ))}
    </div>
  )
}
