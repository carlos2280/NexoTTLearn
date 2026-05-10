import type { EstadoBloque, TipoBloque } from "./listar-bloques.schema"

/**
 * Bloque en listados — NO incluye `contenido` (JSONB con estructura variable
 * segun `tipo`). El detalle expone `contenido` via `BloqueDetalleResponse`.
 */
export interface BloqueResponse {
  readonly id: string
  readonly seccionId: string
  readonly orden: number
  readonly tipo: TipoBloque
  readonly esEvaluable: boolean
  readonly skillQueMideId: string | null
  readonly estado: EstadoBloque
  readonly version: number
  readonly createdAt: string
  readonly updatedAt: string
}

/**
 * Bloque en endpoint de detalle — incluye `contenido` tipado como
 * `Record<string, unknown> | null`. `null` representa un bloque sin contenido
 * persistido (mismo patron que `Cliente.datosContacto`). La forma concreta
 * del JSONB depende del `tipo` y se valida cuando se mute (P3); aqui se
 * expone tal cual desde la BD.
 */
export interface BloqueDetalleResponse extends BloqueResponse {
  readonly contenido: Record<string, unknown> | null
}
