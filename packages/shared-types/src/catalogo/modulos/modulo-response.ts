import type { EstadoModulo } from "./listar-modulos.schema"

export interface ModuloResponse {
  readonly id: string
  readonly titulo: string
  readonly descripcion: string | null
  readonly estado: EstadoModulo
  readonly createdAt: string
  readonly updatedAt: string
}
