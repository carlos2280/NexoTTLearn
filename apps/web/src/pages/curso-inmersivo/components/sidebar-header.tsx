import type { ModoCursoParticipante, PlanResponseParticipante } from "@nexott-learn/shared-types"
import { BotonToggleSidebar } from "./boton-toggle-sidebar"
import { ContadorSidebar } from "./contador-sidebar"
import { eyebrowSidebar } from "./sidebar-plan.helpers"

interface SidebarHeaderProps {
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly plan: PlanResponseParticipante | undefined
  readonly seccionesAbiertasSet: Set<string>
  readonly totalSecciones: number
  readonly onColapsar: () => void
}

/**
 * Cabecera del sidebar del inmersivo: eyebrow del modo + contador de avance
 * + toggle para colapsar. Extraído de `sidebar-plan` para mantenerlo bajo el
 * límite de 150 líneas.
 */
export function SidebarHeader({
  modo,
  soloLectura,
  plan,
  seccionesAbiertasSet,
  totalSecciones,
  onColapsar,
}: SidebarHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2">
      <h2 className="nx-eyebrow text-text-tertiary">{eyebrowSidebar(modo, soloLectura)}</h2>
      <div className="flex items-center gap-2">
        <ContadorSidebar
          modo={modo}
          soloLectura={soloLectura}
          plan={plan}
          seccionesAbiertasSet={seccionesAbiertasSet}
          totalSecciones={totalSecciones}
        />
        <BotonToggleSidebar colapsado={false} onToggle={onColapsar} variante="inline" />
      </div>
    </header>
  )
}
