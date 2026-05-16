/**
 * Cliente en listados — NO incluye `datosContacto` (JSONB libre).
 */
export interface ClienteResponse {
  readonly id: string
  readonly nombre: string
  readonly activo: boolean
  readonly fechaCreacion: string
  readonly createdAt: string
  readonly updatedAt: string
}

/**
 * Cliente en endpoint de detalle — incluye `datosContacto` tipado como
 * `Record<string, unknown> | null`.
 */
export interface ClienteDetalleResponse extends ClienteResponse {
  readonly datosContacto: Record<string, unknown> | null
}
