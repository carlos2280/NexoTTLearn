import { ApiError } from "@/shared/api/api-error"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoListItem } from "@nexott-learn/shared-types"
import { AlertCircle, BookOpen, Plus, RefreshCw, SearchX } from "lucide-react"
import type { VistaCursos } from "../hooks/use-filtros-cursos"
import { CursosGrid, CursosGridSkeleton } from "./cursos-grid"
import { CursosTabla, CursosTablaSkeleton } from "./cursos-tabla"

interface CursosContentProps {
  readonly items: readonly CursoListItem[]
  readonly view: VistaCursos
  readonly isLoading: boolean
  readonly isError: boolean
  readonly error: unknown
  readonly isEmpty: boolean
  readonly isNoResults: boolean
  readonly onRetry: () => void
  readonly onClearFilters: () => void
  readonly onCreate: () => void
  readonly onOpen: (curso: CursoListItem) => void
  readonly onEdit: (curso: CursoListItem) => void
  readonly onDuplicate: (curso: CursoListItem) => void
  readonly onSeguimiento: (curso: CursoListItem) => void
  readonly onCandidatos: (curso: CursoListItem) => void
  readonly onUnpublish: (curso: CursoListItem) => void
  readonly onClose: (curso: CursoListItem) => void
  readonly onDelete: (curso: CursoListItem) => void
}

export function CursosContent(props: CursosContentProps) {
  if (props.isLoading) {
    return props.view === "cards" ? <CursosGridSkeleton /> : <CursosTablaSkeleton />
  }
  if (props.isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="No pudimos cargar los cursos"
        description={
          props.error instanceof ApiError
            ? props.error.message
            : "Ocurrió un error inesperado. Intenta de nuevo."
        }
        action={
          <Button variant="secondary" onClick={props.onRetry}>
            <RefreshCw className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Reintentar
          </Button>
        }
      />
    )
  }
  if (props.isEmpty) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Aún no tienes cursos"
        description="Un curso es la solicitud de un cliente: defines qué áreas necesita, asignas candidatos y los nivelas hasta la entrevista."
        action={
          <Button onClick={props.onCreate}>
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Crear primer curso
          </Button>
        }
      />
    )
  }
  if (props.isNoResults) {
    return (
      <EmptyState
        icon={SearchX}
        title="Sin resultados"
        description="No encontramos cursos que coincidan con esos filtros."
        action={
          <Button variant="secondary" onClick={props.onClearFilters}>
            Limpiar filtros
          </Button>
        }
      />
    )
  }
  if (props.view === "cards") {
    return (
      <CursosGrid
        items={props.items}
        onOpen={props.onOpen}
        onEdit={props.onEdit}
        onDuplicate={props.onDuplicate}
        onSeguimiento={props.onSeguimiento}
        onCandidatos={props.onCandidatos}
        onUnpublish={props.onUnpublish}
        onClose={props.onClose}
        onDelete={props.onDelete}
      />
    )
  }
  return (
    <CursosTabla
      items={props.items}
      onOpen={props.onOpen}
      onEdit={props.onEdit}
      onDuplicate={props.onDuplicate}
      onSeguimiento={props.onSeguimiento}
      onCandidatos={props.onCandidatos}
      onUnpublish={props.onUnpublish}
      onClose={props.onClose}
      onDelete={props.onDelete}
    />
  )
}
