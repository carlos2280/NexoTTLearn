import type { ModoCursoParticipante, PlanResponseParticipante } from "@nexott-learn/shared-types"

interface ContadorSidebarProps {
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly plan: PlanResponseParticipante | undefined
  readonly seccionesAbiertasSet: ReadonlySet<string>
  readonly totalSecciones: number
}

/**
 * Contador "x/y" del header del sidebar. Cada modo usa una metrica distinta:
 *
 * - `soloLectura` (CERRADO): total/total — todo el recorrido cuenta como visto.
 * - `asignado`: `plan.avance.seccionesCompletadas/seccionesObligatorias` —
 *   solo cuenta lo del plan personal, no las opcionales abiertas.
 * - `voluntario`: aperturas/total — sin plan, lo abierto es el progreso.
 * - `preview`: no se pinta contador (catalogo sin progreso).
 */
export function ContadorSidebar({
  modo,
  soloLectura,
  plan,
  seccionesAbiertasSet,
  totalSecciones,
}: ContadorSidebarProps) {
  if (soloLectura) {
    return (
      <span className="font-mono text-caption text-text-tertiary">
        {totalSecciones}/{totalSecciones}
      </span>
    )
  }
  if (modo === "asignado" && plan) {
    return (
      <span className="font-mono text-caption text-text-tertiary">
        {plan.avance.seccionesCompletadas}/{plan.avance.seccionesObligatorias}
      </span>
    )
  }
  if (modo === "voluntario") {
    return (
      <span className="font-mono text-caption text-text-tertiary">
        {seccionesAbiertasSet.size}/{totalSecciones}
      </span>
    )
  }
  return null
}
