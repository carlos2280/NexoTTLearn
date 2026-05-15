import type { ApiError } from "@/shared/api/api-error"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
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
    return <Banner tone="danger">No pudimos cargar tus cursos. Reintenta en un momento.</Banner>
  }
  if (!data || data.data.length === 0) {
    return <EmptyMisCursos filtros={filtros} />
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.data.map((curso) => (
          <TarjetaCurso key={curso.asignacionId} curso={curso} />
        ))}
      </div>
      {data.meta.total > data.meta.pageSize ? (
        <Pagination
          page={data.meta.page}
          pageSize={data.meta.pageSize}
          total={data.meta.total}
          onCambiarPage={onCambiarPage}
        />
      ) : null}
    </div>
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
          ? "Aún no tienes cursos. Cuando el administrador te asigne uno aparecerá aquí. Mientras tanto, puedes inscribirte por tu cuenta a cualquiera de los cursos abiertos."
          : "Prueba a quitar algún filtro para ver más resultados."
      }
      accion={
        sinFiltros ? (
          <Button variant="link" onClick={() => navigate(RUTAS.participante.catalogo)}>
            Explorar catálogo
          </Button>
        ) : undefined
      }
    />
  )
}
