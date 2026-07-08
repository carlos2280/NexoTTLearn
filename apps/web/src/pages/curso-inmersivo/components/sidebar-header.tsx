import type { ModoCursoParticipante, PlanResponseParticipante } from "@nexott-learn/shared-types"
import { ContadorSidebar } from "./contador-sidebar"
import { eyebrowSidebar } from "./sidebar-plan.helpers"

interface SidebarHeaderProps {
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly plan: PlanResponseParticipante | undefined
  readonly seccionesAbiertasSet: Set<string>
  readonly totalSecciones: number
}

/**
 * Cabecera del sidebar del inmersivo: eyebrow del modo + contador de avance.
 * El colapso del sidebar vive ahora en el activity-bar del IDE (riel izquierdo),
 * así que aquí ya no hay toggle. Extraído de `sidebar-plan` para mantenerlo
 * bajo el límite de 150 líneas.
 */
export function SidebarHeader({
  modo,
  soloLectura,
  plan,
  seccionesAbiertasSet,
  totalSecciones,
}: SidebarHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2">
      <h2 className="nx-eyebrow text-text-tertiary">{eyebrowSidebar(modo, soloLectura)}</h2>
      <ContadorSidebar
        modo={modo}
        soloLectura={soloLectura}
        plan={plan}
        seccionesAbiertasSet={seccionesAbiertasSet}
        totalSecciones={totalSecciones}
      />
    </header>
  )
}
