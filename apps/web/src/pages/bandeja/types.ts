import type { SiguienteAccion } from "@nexott-learn/shared-types"
import type { LucideIcon } from "lucide-react"

/**
 * Extensiones LOCALES de tipos oficiales mientras el backend no implementa
 * los campos definidos en `el_viaje_colaborador.md`. Cuando los tickets
 * correspondientes entren a `@nexott-learn/shared-types`, mover y borrar.
 */

// TODO B-1: cuando el backend implemente `ESPERANDO_REVISION`, mover este
// caso al schema oficial de `SiguienteAccion` y borrar la extensión local.
export interface SiguienteAccionEsperandoRevision {
  readonly tipo: "ESPERANDO_REVISION"
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  /** Qué se está revisando: transversal o entrevista IA. */
  readonly enRevision: "transversal" | "entrevistaIa"
  /** ISO. Cuándo se envió a revisión. */
  readonly fechaEnvio: string
}

export type SiguienteAccionConRevision = SiguienteAccion | SiguienteAccionEsperandoRevision

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

// TODO B-3: cuando el backend implemente `GET /me/ficha/resumen`, mover el
// tipo a `@nexott-learn/shared-types` y borrar la extensión local.
export type NivelCualitativoArea = "solido" | "enDesarrollo" | "inicial"

export interface FichaResumenTopArea {
  readonly areaId: string
  readonly areaNombre: string
  /** Slug del catálogo de áreas → mapea a `--color-area-{codigo}`. */
  readonly areaCodigo: string
  readonly nivelCualitativo: NivelCualitativoArea
}

export interface FichaResumenResponse {
  readonly totalAreasConActividad: number
  readonly topAreas: readonly FichaResumenTopArea[]
  readonly ultimaSkillDemostrada: {
    readonly skillNombre: string
    readonly fecha: string
  } | null
}

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
