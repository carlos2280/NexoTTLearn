import { httpClient } from "@/shared/api/http-client"

// TODO B-3: cuando el backend implemente el endpoint, mover este tipo a
// `@nexott-learn/shared-types` y borrar el local.
export interface FichaResumenResponseDTO {
  readonly totalAreasConActividad: number
  readonly topAreas: readonly {
    readonly areaId: string
    readonly areaNombre: string
    readonly nivelCualitativo: "solido" | "enDesarrollo" | "inicial"
  }[]
  readonly ultimaSkillDemostrada: {
    readonly skillNombre: string
    readonly fecha: string
  } | null
}

/**
 * `GET /api/v1/me/ficha/resumen` (B-3). Agregado cualitativo de la ficha
 * para el widget "Tu camino" de la bandeja. Cero números crudos en el
 * cliente — el server decide el criterio.
 */
export function obtenerFichaResumen(): Promise<FichaResumenResponseDTO> {
  return httpClient.get<FichaResumenResponseDTO>("/me/ficha/resumen")
}
