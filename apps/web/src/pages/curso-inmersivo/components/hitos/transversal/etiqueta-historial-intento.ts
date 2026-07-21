import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"

export type TonoHistorialIntento = "aprobado" | "anulado" | "neutro"

export interface EtiquetaHistorialIntento {
  readonly texto: string
  readonly tono: TonoHistorialIntento
}

/**
 * Etiqueta cualitativa (sin números) de un intento en el historial del
 * participante. Distingue cada estado para no mostrar como "Aún no" lo que en
 * realidad está EN REVISIÓN (EVALUADO, pendiente de que el admin finalice) o fue
 * ANULADO por el admin. Solo en FINALIZADO el `aprobado` es fiable.
 */
export function etiquetaHistorialIntento(
  intento: Pick<IntentoTransversalParticipanteResponse, "estado" | "aprobado">,
): EtiquetaHistorialIntento {
  if (intento.estado === "EN_EVALUACION") {
    return { texto: "En evaluación", tono: "neutro" }
  }
  if (intento.estado === "EVALUADO") {
    return { texto: "En revisión", tono: "neutro" }
  }
  if (intento.estado === "ANULADO") {
    return { texto: "Anulado", tono: "anulado" }
  }
  if (intento.estado === "FALLO_ACCESO_REPO") {
    // Repo inaccesible (B2c): no se pudo abrir y no consume cupo. Tono neutro
    // para no leerse como un rechazo del trabajo del alumno.
    return { texto: "Repo no accesible", tono: "neutro" }
  }
  if (intento.aprobado === true) {
    return { texto: "Aprobado", tono: "aprobado" }
  }
  return { texto: "Aún no", tono: "neutro" }
}
