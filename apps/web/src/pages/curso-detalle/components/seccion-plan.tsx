import type { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import type { PlanResponseParticipante } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"
import { EmptyPlan } from "./empty-plan"
import { ListaModulos } from "./lista-modulos"

interface SeccionPlanProps {
  readonly plan: PlanResponseParticipante | undefined
  readonly errorPlan: ApiError | null
}

/**
 * Encapsula los 3 estados del plan:
 *  - error → aviso inline (no rompe la cabecera ni el panel de skills).
 *  - vacío → empty pedagógico (doc §5.5).
 *  - con secciones → lista de módulos.
 */
export function SeccionPlan({ plan, errorPlan }: SeccionPlanProps) {
  const navigate = useNavigate()

  if (errorPlan) {
    return (
      <div className="rounded-md border border-warning/30 bg-warning-soft p-4 text-body-sm text-warning-on-soft">
        No pudimos cargar tu plan en este momento. El resto del curso sigue disponible. Si el
        problema persiste, contacta al administrador.
      </div>
    )
  }

  if (!plan || plan.items.length === 0) {
    return <EmptyPlan />
  }

  return (
    <ListaModulos
      modulos={plan.items}
      onAbrirSeccion={(seccionId) => navigate(`${RUTAS.bandeja}?seccion=${seccionId}`)}
    />
  )
}
