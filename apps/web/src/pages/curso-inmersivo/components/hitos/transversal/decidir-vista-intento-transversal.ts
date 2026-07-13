import type { EstadoIntentoTransversal } from "@nexott-learn/shared-types"

export type VistaIntentoTransversal = "evaluando" | "en-revision" | "aprobado" | "aun-no"

/**
 * Decide qué vista mostrarle al participante para un intento ya existente (el
 * caso "sin intento / reintentar" lo resuelve el orquestador antes).
 *
 * Clave: EVALUADO (la IA terminó pero el admin aún no finaliza) tiene su propia
 * vista "en revisión". Antes ese estado intermedio caía en "aun-no" porque
 * `aprobado` es `null` hasta FINALIZADO → mostraba un "Casi" falso y dejaba
 * reenviar un proyecto que quizá aprobó. Este mapeo lo corrige.
 */
export function decidirVistaIntentoTransversal(intento: {
  readonly estado: EstadoIntentoTransversal
  readonly aprobado: boolean | null
}): VistaIntentoTransversal {
  if (intento.estado === "EN_EVALUACION") {
    return "evaluando"
  }
  if (intento.estado === "EVALUADO") {
    return "en-revision"
  }
  // FINALIZADO / ANULADO: el veredicto ya está sellado (o el intento quedó sin
  // efecto). Solo aquí `aprobado` es fiable.
  if (intento.aprobado) {
    return "aprobado"
  }
  return "aun-no"
}
