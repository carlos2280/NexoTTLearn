import type { ResumenValidacion } from "@/features/codigo-ejecucion"
import type { MotivoNoValidable } from "./emparejar-reto"

/**
 * Tipos del panel "Retos" del detalle de curso: valida que la solución de
 * referencia de cada reto de código pase sus propios tests, en lote sobre todo
 * el curso. Es el hermano en lote del guardarraíl de a uno del editor admin
 * (`editores/codigo-tests/validar-referencia.tsx`).
 *
 * Read-only: NO persiste nada, NO toca notas, intentos ni progreso de alumnos.
 */

/**
 * Un reto de código proyectado desde el listado de bloques evaluables del
 * curso. Solo lo que la validación necesita: qué bloque validar y de qué
 * sección sale su contenido (la `solucionReferencia` y los `tests` viven en el
 * bloque hermano `CODIGO_TESTS` de la MISMA sección).
 */
export interface RetoDelCurso {
  readonly bloqueId: string
  /** Posición del bloque dentro de su sección. Desambigua dos retos de la misma sección. */
  readonly orden: number
  readonly seccionId: string
  readonly seccionTitulo: string
  readonly seccionOrden: number
}

export interface GrupoModulo {
  readonly moduloId: string
  readonly titulo: string
  readonly retos: readonly RetoDelCurso[]
}

/**
 * Estado de validación de un reto. `no-validable` y `error` se distinguen a
 * propósito de `falla`: no es lo mismo "la solución no pasa sus tests" (culpa
 * del contenido, accionable por el admin) que "no pudimos ni intentarlo"
 * (lenguaje no autocorregible, tests sin enlazar, o el navegador falló).
 */
export type EstadoReto =
  | { readonly tipo: "pendiente" }
  | { readonly tipo: "validando" }
  | { readonly tipo: "ok"; readonly totales: number }
  | { readonly tipo: "falla"; readonly resumen: ResumenValidacion }
  | { readonly tipo: "no-ejecuta"; readonly detalle: string }
  | { readonly tipo: "no-validable"; readonly motivo: string; readonly codigo: MotivoNoValidable }
  | { readonly tipo: "error"; readonly mensaje: string }

export interface Progreso {
  readonly hechos: number
  readonly total: number
}

/**
 * Cuenta por categoría dentro de un módulo, para el chip de su cabecera.
 * `noAplica` existe para que se cumpla `ok + rotos + sinValidar + noAplica ===
 * total`: sin esa categoría, los retos en un lenguaje no autocorregible no
 * caían en ningún contador y un módulo podía anunciar "Todos pasan" habiendo
 * mirado solo uno de diez.
 */
export interface ResumenGrupo {
  readonly total: number
  readonly ok: number
  readonly rotos: number
  readonly sinValidar: number
  readonly noAplica: number
}

/** Instancia única y congelada: se lee una vez por fila en cada render. */
export const ESTADO_PENDIENTE: EstadoReto = Object.freeze({ tipo: "pendiente" as const })
