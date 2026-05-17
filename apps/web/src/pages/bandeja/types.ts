import type { LucideIcon } from "lucide-react"

/**
 * Atmósfera visual de la carta del siguiente paso. Modula sombra, borde y
 * fondo. NO determina el CTA — un caso "rutina" puede tener CTA primary o
 * secondary según su urgencia.
 *
 *  - `aurora`   → reservado para CULMINACIONES: APTO / COMPLETADO.
 *  - `urgencia` → warmth + borde lateral. Deadline crítico.
 *  - `rutina`   → surface plano. La mayoría de los casos.
 *  - `calmada`  → sin sombra ni borde fuerte. Esperando revisión.
 */
export type AtmosferaCarta = "aurora" | "urgencia" | "rutina" | "calmada"

export interface CopySiguiente {
  readonly atmosfera: AtmosferaCarta
  readonly ctaVariant: "primary" | "aurora" | "secondary" | "ghost"
  readonly eyebrow: string
  readonly titulo: string
  readonly descripcion: string
  readonly cta: string
  readonly ruta: string
  readonly icono: LucideIcon
  /**
   * Línea breve junto al CTA: "por qué te muestro esto ahora". `null` cuando
   * el CTA por si solo basta (ej. cierre NO_APTO — no anadir contexto que
   * suene a castigo).
   */
  readonly porQueAqui: string | null
  /** Slug del área del curso destino — pinta barra superior + eyebrow del área. */
  readonly areaCodigo?: string | null
  /** Nombre del área para el eyebrow ("BACKEND · JAVA SENIOR"). */
  readonly areaNombre?: string | null
  /** Título del curso para el eyebrow. Distinto al `titulo` principal. */
  readonly cursoTituloEyebrow?: string | null
}
