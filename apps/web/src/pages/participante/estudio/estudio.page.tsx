import { useModuloInmersivo } from "@/features/participante-modulo-inmersivo/hooks/use-modulo-inmersivo"
import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useParams } from "react-router-dom"
import { EstudioSkeleton } from "./components/estudio-skeleton"
import { InmersivoShell } from "./components/inmersivo-shell"

// /cursos/:slug/modulo/:moduloId · modo estudio inmersivo del participante.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/estudio/README.md.
// Vive FUERA de LayoutParticipante — el chrome global se sustituye por
// mini-header + sidebar + dock-progreso (paridad con editor admin).

export function EstudioPage() {
  const { slug = "", moduloId = "" } = useParams<{ slug: string; moduloId: string }>()
  const query = useModuloInmersivo(slug, moduloId)

  if (query.isLoading) {
    return <EstudioSkeleton />
  }

  if (query.isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0 p-8">
        <EmptyState
          icon={AlertTriangle}
          title="No pudimos cargar el modulo"
          description={mensajeError(query.error)}
          action={
            <Button onClick={() => query.refetch()} loading={query.isFetching} variant="secondary">
              <RefreshCw className="size-4" strokeWidth={1.75} />
              Reintentar
            </Button>
          }
        />
      </div>
    )
  }

  if (!query.data) {
    return null
  }

  return <InmersivoShell data={query.data} />
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
