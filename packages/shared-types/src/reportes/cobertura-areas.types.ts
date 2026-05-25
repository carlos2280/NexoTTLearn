import { z } from "zod"
import type { NivelCualitativoArea } from "../evaluacion-inicial/ficha.schema"

/**
 * GET /reportes/cobertura-areas — vista ejecutiva global del talento NTT,
 * agregado por area (sin curso seleccionado).
 *
 * Pensado para responder en 3 segundos:
 *   - ¿Cuantos colaboradores activos tengo?
 *   - ¿Cuantas areas tengo "sanas" (promedio >= benchmark)?
 *   - ¿Cual es la peor brecha?
 *   - ¿Quien sobresale? ¿Quien necesita apoyo?
 *
 * Filtros opcionales: clienteId (limitar a colaboradores con asignaciones de
 * cursos de ese cliente) y periodo (no implementado en v1, slot reservado).
 */
export const coberturaAreasQuerySchema = z
  .object({
    clienteId: z.string().uuid().optional(),
  })
  .strict()
export type CoberturaAreasQuery = z.infer<typeof coberturaAreasQuerySchema>

export interface CoberturaAreaConteoNiveles {
  readonly excelencia: number
  readonly solido: number
  readonly enDesarrollo: number
  readonly inicial: number
  readonly sinTocar: number
}

export interface CoberturaAreaItem {
  readonly areaId: string
  readonly nombre: string
  /** Headcount de colaboradores con al menos una skill activa en esta area. */
  readonly totalColaboradores: number
  /** Promedio simple de `notaActual` (ignora null) en skills de esta area. */
  readonly promedio: number | null
  /** Benchmark organizacional fijo (umbral solido = 70). */
  readonly benchmark: number
  /** `promedio − benchmark`. Negativo => bajo benchmark. */
  readonly brecha: number | null
  readonly conteoNiveles: CoberturaAreaConteoNiveles
  /** Nivel agregado del area segun promedio (escala canonica de 5 niveles). */
  readonly nivelAgregado: NivelCualitativoArea
  /** Reservado para sparkline temporal — v1 lo deja vacio. */
  readonly serieTemporal: readonly number[]
}

export interface CoberturaAreaKpis {
  readonly totalColaboradoresActivos: number
  /** `areas[].length` con `promedio >= benchmark`. */
  readonly areasSanas: number
  readonly totalAreas: number
  /** Area con mayor brecha negativa (peor). `null` si todas estan sobre benchmark. */
  readonly areaPeorBrecha: {
    readonly areaId: string
    readonly nombre: string
    readonly brecha: number
  } | null
  /** Colaboradores en nivel excelencia agregado (al menos una area en excelencia). */
  readonly colaboradoresEnExcelencia: number
}

export interface CoberturaTopColaborador {
  readonly id: string
  readonly nombre: string
  readonly email: string
  readonly promedioGlobal: number
  readonly areasExcelencia: number
}

export interface CoberturaListosParaPresentar {
  readonly colaboradoresAptos: number
  readonly cursosActivos: number
  readonly clientesConPipeline: number
}

export interface CoberturaAreasResponse {
  readonly kpis: CoberturaAreaKpis
  readonly areas: readonly CoberturaAreaItem[]
  readonly top: readonly CoberturaTopColaborador[]
  readonly necesitanApoyo: readonly CoberturaTopColaborador[]
  readonly listosParaPresentar: CoberturaListosParaPresentar
  readonly meta: { readonly frescura: string }
}
