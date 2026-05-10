import { EmptyState } from "@/shared/ui/patterns/empty-state"
import type { CursoCard } from "@nexott-learn/shared-types"
import { Search } from "lucide-react"
import { CourseCardComponent } from "./course-card"

interface MisCursosGridProps {
  readonly asignados: readonly CursoCard[]
  readonly libres: readonly CursoCard[]
  readonly hayBusquedaActiva: boolean
  readonly onLimpiar: () => void
}

// §4.4 doc canonico. 2 secciones obligatorias (Asignados / Libres). Cada una
// se oculta si vacia. Si ambas vacias y hay busqueda activa: empty state §6.4.
export function MisCursosGrid({
  asignados,
  libres,
  hayBusquedaActiva,
  onLimpiar,
}: MisCursosGridProps) {
  if (asignados.length === 0 && libres.length === 0 && hayBusquedaActiva) {
    return (
      <EmptyState
        icon={Search}
        title="Ningun curso coincide con tu busqueda"
        action={
          <button
            type="button"
            onClick={onLimpiar}
            className="rounded-full border border-glass-border bg-surface-1 px-4 py-2 font-medium text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            Limpiar filtros
          </button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-10">
      {asignados.length > 0 ? (
        <Seccion titulo="Cursos Asignados" cursos={asignados} startIndex={0} />
      ) : null}
      {libres.length > 0 ? (
        <Seccion titulo="Cursos Libres" cursos={libres} startIndex={asignados.length} />
      ) : null}
    </div>
  )
}

interface SeccionProps {
  readonly titulo: string
  readonly cursos: readonly CursoCard[]
  readonly startIndex: number
}

function Seccion({ titulo, cursos, startIndex }: SeccionProps) {
  return (
    <section className="flex flex-col gap-4">
      <p className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]">
        {titulo}
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {cursos.map((curso, i) => (
          <CourseCardComponent key={curso.id} curso={curso} index={startIndex + i} />
        ))}
      </div>
    </section>
  )
}
