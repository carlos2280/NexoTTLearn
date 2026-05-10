import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Alert } from "@/shared/ui/primitives/alert"
import { Button } from "@/shared/ui/primitives/button"
import { AlertTriangle, ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface CursoDetalleErrorProps {
  readonly error: Error
  readonly onReintentar: () => void
}

export function CursoDetalleError({ error, onReintentar }: CursoDetalleErrorProps) {
  const navigate = useNavigate()
  const apiError = error instanceof ApiError ? error : null

  if (apiError?.status === 404) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Curso no encontrado"
        description="El curso que buscas no existe o fue eliminado."
        action={
          <Button onClick={() => navigate(RUTAS.admin.cursos)}>
            <ChevronLeft aria-hidden="true" />
            Volver al listado
          </Button>
        }
      />
    )
  }

  return (
    <Alert variant="error">
      <p className="font-semibold text-sm">No pudimos cargar el curso</p>
      <p className="mt-1 text-sm text-text-secondary">{error.message}</p>
      <div className="mt-3">
        <Button variant="secondary" size="sm" onClick={onReintentar}>
          Reintentar
        </Button>
      </div>
    </Alert>
  )
}
