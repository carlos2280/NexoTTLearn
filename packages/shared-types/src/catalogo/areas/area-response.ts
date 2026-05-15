import type { AreaCodigo } from "./area-codigo"

export interface AreaResponse {
  readonly id: string
  readonly nombre: string
  readonly codigo: AreaCodigo
  readonly descripcion: string | null
  readonly createdAt: string
  readonly updatedAt: string
}
