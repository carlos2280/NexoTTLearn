import type { CatalogoVitrinaItem } from "@nexott-learn/shared-types"
import { CatalogoCard } from "./catalogo-card"

interface CatalogoGridProps {
  readonly items: readonly CatalogoVitrinaItem[]
}

// §1 vitrina.md · grid 3 col desktop / 2 tablet / 1 mobile (V-01).
export function CatalogoGrid({ items }: CatalogoGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
      {items.map((curso, i) => (
        <CatalogoCard key={curso.id} curso={curso} index={i} />
      ))}
    </div>
  )
}
