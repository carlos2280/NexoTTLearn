import type {
  ModoCursoParticipante,
  PlanResponseParticipante,
  SeccionPlanItemParticipante,
} from "@nexott-learn/shared-types"

/** Texto del `eyebrow` segun el momento del curso. */
export function eyebrowSidebar(modo: ModoCursoParticipante, soloLectura: boolean): string {
  if (soloLectura) {
    return "Recorrido completado"
  }
  if (modo === "asignado") {
    return "Plan de estudio"
  }
  if (modo === "voluntario") {
    return "Contenido"
  }
  return "Vista previa"
}

/**
 * Aplana el plan personal en un mapa `seccionId -> item` para que cada fila
 * del sidebar lo consulte en O(1) sin recorrer modulos. Devuelve un mapa
 * vacio cuando no hay plan (voluntario/preview, D-AS-1).
 */
export function indexarPlanPorSeccion(
  plan: PlanResponseParticipante | undefined,
): ReadonlyMap<string, SeccionPlanItemParticipante> {
  const map = new Map<string, SeccionPlanItemParticipante>()
  if (!plan) {
    return map
  }
  for (const modulo of plan.items) {
    for (const seccion of modulo.secciones) {
      map.set(seccion.seccionId, seccion)
    }
  }
  return map
}
