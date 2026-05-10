import { useVistaCurso } from "@/features/participante-vista-curso/hooks/use-vista-curso"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useParams } from "react-router-dom"
import { VistaCursoAreas } from "./components/vista-curso-areas"
import { VistaCursoBreadcrumb } from "./components/vista-curso-breadcrumb"
import { VistaCursoHeroBlock } from "./components/vista-curso-hero"
import { VistaCursoHitosBlock } from "./components/vista-curso-hitos"
import { VistaCursoSkeleton } from "./components/vista-curso-skeleton"

// /cursos/{slug} · vista profunda del curso.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/vista-curso.md
export function VistaCursoPage() {
  const { slug = "" } = useParams<{ slug: string }>()
  const query = useVistaCurso(slug)

  if (query.isLoading) {
    return <VistaCursoSkeleton />
  }

  if (query.isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar el curso"
        description={mensajeError(query.error)}
        action={
          <Button onClick={() => query.refetch()} loading={query.isFetching} variant="secondary">
            <RefreshCw className="size-4" strokeWidth={1.75} />
            Reintentar
          </Button>
        }
      />
    )
  }

  if (!query.data) {
    return null
  }

  const { hero, areas, hitos } = query.data

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-8">
      <VistaCursoBreadcrumb tituloCurso={hero.titulo} />
      <VistaCursoHeroBlock hero={hero} />
      <VistaCursoAreas areas={areas} />
      <VistaCursoHitosBlock hitos={hitos} />
    </div>
  )
}

function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Intentalo de nuevo en unos segundos."
}
