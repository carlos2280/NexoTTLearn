import type { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Pagination } from "@/shared/components/ui/pagination"
import { RUTAS } from "@/shared/constants/rutas"
import type { MeCursoResumen, Paginated } from "@nexott-learn/shared-types"
import { BookOpen } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { FiltrosMisCursos } from "../mis-cursos.types"
import { MisCursosSkeleton } from "./mis-cursos-skeleton"
import { TarjetaCurso } from "./tarjeta-curso"

interface ResultadoMisCursosProps {
  readonly isLoading: boolean
  readonly error: ApiError | null
  readonly data: Paginated<MeCursoResumen> | undefined
  readonly filtros: FiltrosMisCursos
  readonly onCambiarPage: (page: number) => void
}

export function ResultadoMisCursos({
  isLoading,
  error,
  data,
  filtros,
  onCambiarPage,
}: ResultadoMisCursosProps) {
  if (isLoading) {
    return <MisCursosSkeleton />
  }
  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger-soft p-4 text-body-sm text-danger-on-soft">
        No pudimos cargar tus cursos. Reintenta en un momento.
      </div>
    )
  }
  if (!data || data.data.length === 0) {
    return <EmptyMisCursos filtros={filtros} />
  }
  return (
    <>
      <div className="flex flex-col gap-4">
        {data.data.map((curso) => (
          <TarjetaCurso key={curso.asignacionId} curso={curso} />
        ))}
      </div>
      <Pagination
        page={data.meta.page}
        pageSize={data.meta.pageSize}
        total={data.meta.total}
        onCambiarPage={onCambiarPage}
      />
    </>
  )
}

function EmptyMisCursos({ filtros }: { readonly filtros: FiltrosMisCursos }) {
  const navigate = useNavigate()
  const sinFiltros = filtros.estado === "TODOS" && filtros.rol === "TODOS"

  return (
    <EmptyState
      icono={BookOpen}
      titulo="No hay cursos que coincidan"
      descripcion={
        sinFiltros
          ? "Aún no tienes cursos. Cuando el administrador te asigne uno, aparecerá aquí. Mientras tanto, puedes inscribirte por tu cuenta a cualquiera de los cursos abiertos."
          : "Prueba a quitar algún filtro para ver más resultados."
      }
      accion={
        sinFiltros ? (
          <button
            type="button"
            onClick={() => navigate(RUTAS.participante.catalogo)}
            className="text-accent text-body-sm underline-offset-4 hover:underline"
          >
            Explorar catálogo
          </button>
        ) : undefined
      }
    />
  )
}
