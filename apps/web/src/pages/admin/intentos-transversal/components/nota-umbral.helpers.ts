/**
 * Estado de una nota frente al umbral de aprobación. Colorea la nota con la capa
 * de color "feedback" (semántica, sin marca — ver MANIFIESTO ley 04): reprueba =
 * rojo, aprueba = verde, sin-nota = neutro. Pura para testearla sin render.
 */
export type EstadoNota = "sin-nota" | "aprueba" | "reprueba"

export function estadoNota(nota: number | null, umbral: number): EstadoNota {
  if (nota === null) {
    return "sin-nota"
  }
  return nota >= umbral ? "aprueba" : "reprueba"
}

/** Clase de color de texto por estado (tokens semánticos, ver `globals.css`). */
export const CLASE_TEXTO_NOTA: Record<EstadoNota, string> = {
  "sin-nota": "text-text-tertiary",
  aprueba: "text-success",
  reprueba: "text-danger",
}
