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

/**
 * Clase de color para la nota en TEXTO GRANDE (display/h2): verde aprueba, rojo
 * reprueba. A ese tamaño `text-success`/`text-danger` pasan contraste AA (texto
 * grande, umbral 3:1). Ver `globals.css`.
 */
export const CLASE_TEXTO_NOTA: Record<EstadoNota, string> = {
  "sin-nota": "text-text-tertiary",
  aprueba: "text-success",
  reprueba: "text-danger",
}

/**
 * Clase de color para la nota en TEXTO CHICO (body-sm/caption): solo resalta lo
 * que reprueba (MANIFIESTO ley 07 "pendiente respira"); lo aprobado y lo sin
 * nota quedan neutros. Usa el tono `-on-soft` (más oscuro) para pasar AA (4.5:1)
 * a tamaño chico, donde `text-danger` plano queda al límite y `text-success`
 * directamente no llega.
 */
export const CLASE_TEXTO_NOTA_SM: Record<EstadoNota, string> = {
  "sin-nota": "text-text-secondary",
  aprueba: "text-text-secondary",
  reprueba: "text-danger-on-soft",
}
