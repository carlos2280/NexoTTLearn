import type {
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
} from "@nexott-learn/shared-types"

/**
 * Extensiones LOCALES de tipos oficiales mientras el backend no implementa
 * los campos definidos en `el_viaje_colaborador.md`. Cada bloque marca el
 * ticket de backend que lo formalizará en `@nexott-learn/shared-types`.
 *
 * Cuando los tickets se entreguen, mover los campos al schema oficial y
 * borrar este archivo.
 */

// TODO B-4: cuando llegue al backend, mover `caminoHaciaApto` al schema
// oficial de `MeAvanceCursoResponse` y borrar `MeAvanceCursoConCamino`.
export interface CaminoHaciaAptoPorArea {
  readonly areaId: string
  readonly areaCodigo: string
  readonly areaNombre: string
  readonly skillsExigidas: number
  readonly skillsDemostradas: number
  readonly nivelCualitativo: "solido" | "enDesarrollo" | "porExplorar"
}

export interface CaminoHaciaApto {
  readonly faltantesParaApto: number
  readonly estaListo: boolean
  readonly porArea: readonly CaminoHaciaAptoPorArea[]
}

export type MeAvanceCursoConCamino = MeAvanceCursoResponse & {
  readonly caminoHaciaApto?: CaminoHaciaApto
}

// TODO B-6: cuando llegue al backend, añadir `motivoBloqueo: string | null` a
// los schemas de `DisponibilidadTransversalResponse` y
// `DisponibilidadEntrevistaIaResponse`, y borrar estas extensiones.
export type DisponibilidadTransversalConMotivo = DisponibilidadTransversalResponse & {
  readonly motivoBloqueo?: string | null
}

export type DisponibilidadEntrevistaIaConMotivo = DisponibilidadEntrevistaIaResponse & {
  readonly motivoBloqueo?: string | null
}
