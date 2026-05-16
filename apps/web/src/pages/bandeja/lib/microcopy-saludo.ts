import type { SiguienteAccionConRevision } from "../types"

/**
 * Microcopy contextual del saludo de la bandeja según el `siguienteAccion`
 * que devuelve el server. Calidez sobria, sin emojis, sin gamificación —
 * habla del viaje del participante con un tono honesto.
 */
export function microcopyDelSaludo(accion: SiguienteAccionConRevision | null): string {
  if (accion === null) {
    return "Cuando arranque tu primer curso, el viaje empieza aquí."
  }
  switch (accion.tipo) {
    case "RESULTADO_CIERRE_LISTO":
      return accion.resultado === "APTO"
        ? "Un hito alcanzado en tu camino."
        : "Otro paso del viaje, sin importar el resultado."
    case "DEADLINE_CRITICO":
      return "El viaje sigue. Un pequeño avance hoy ya cuenta."
    case "TRANSVERSAL_DISPONIBLE":
    case "ENTREVISTA_IA_DISPONIBLE":
      return "Estás a un paso del cierre. Te lo has ganado."
    case "ASIGNACION_NUEVA":
      return "Un nuevo capítulo del viaje empieza."
    case "EXPLORAR_VOLUNTARIADO":
      return "Tu próximo paso lo eliges tú."
    case "CASO_REABIERTO":
      return "El viaje no es lineal. A veces se vuelve para avanzar mejor."
    case "ESPERANDO_REVISION":
      return "El evaluador está revisando. Tu siguiente movimiento ya llegará."
    default:
      return "Tu camino continúa."
  }
}
