import type { BloqueResponse, SeccionResponse } from "@nexott-learn/shared-types"

/**
 * Lo que esta seleccionado en el arbol del builder.
 * Cuando no hay nada seleccionado, el panel derecho muestra propiedades del modulo.
 */
export type Seleccion =
  | { readonly tipo: "modulo" }
  | { readonly tipo: "seccion"; readonly seccionId: string }
  | { readonly tipo: "bloque"; readonly bloqueId: string }

/**
 * Una seccion enriquecida con sus bloques en orden, para alimentar el arbol.
 */
export interface SeccionConBloques {
  readonly seccion: SeccionResponse
  readonly bloques: readonly BloqueResponse[]
}
