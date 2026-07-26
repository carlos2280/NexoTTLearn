import type {
  MeAvanceCursoResponse,
  ModoCursoParticipante,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"

interface ContadorSidebarProps {
  readonly modo: ModoCursoParticipante
  readonly soloLectura: boolean
  readonly plan: PlanResponseParticipante | undefined
  readonly avance: MeAvanceCursoResponse | undefined
  readonly totalSecciones: number
}

/**
 * Contador "x/y" del header del sidebar. Cada modo usa una metrica distinta:
 *
 * - `soloLectura` (CERRADO): total/total — todo el recorrido cuenta como visto.
 * - `asignado`: `plan.avance.seccionesCompletadas/seccionesObligatorias` —
 *   solo cuenta lo del plan personal, no las opcionales abiertas.
 * - `voluntario`: `avance.seccionesCompletadas/seccionesObligatorias` tal cual
 *   los manda el backend, que es el mismo calculo del que sale el porcentaje
 *   del statusbar. Contaba aperturas (recorrido), lo que mostraba "38/38" junto
 *   a un "92% completado" en la misma pantalla (P28); re-derivarlo en cliente
 *   habria reabierto la puerta a que ambos numeros se separen otra vez.
 * - `preview`: no se pinta contador (catalogo sin progreso).
 */
export function ContadorSidebar({
  modo,
  soloLectura,
  plan,
  avance,
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
  // Sin avance cargado no se pinta contador: un "0/38" transitorio se lee como
  // "no has hecho nada", peor que no mostrar nada mientras carga.
  if (modo === "voluntario" && avance) {
    return (
      <span className="font-mono text-caption text-text-tertiary">
        {avance.seccionesCompletadas}/{avance.seccionesObligatorias}
      </span>
    )
  }
  return null
}
