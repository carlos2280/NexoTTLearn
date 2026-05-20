import { z } from "zod"
import type { NivelCualitativoArea } from "../evaluacion-inicial/ficha.schema"

/**
 * GET /reportes/cobertura-curso — vista ejecutiva de cobertura de skills
 * exigidas por un curso vs. nivel actual de los colaboradores asignados.
 *
 * Devuelve la matriz {colaborador} x {skill exigida} con nota y etiqueta
 * cualitativa (escala canonica de 5 niveles, ver
 * `apps/api/src/colaboradores/nivel-cualitativo.helpers.ts`).
 *
 * Pensado para alimentar visualizaciones agregadas (radar dual, heatmap,
 * small multiples). No exporta — solo JSON.
 */
export const coberturaCursoQuerySchema = z
  .object({
    cursoId: z.string().uuid(),
  })
  .strict()
export type CoberturaCursoQuery = z.infer<typeof coberturaCursoQuerySchema>

export interface CoberturaSkillExigida {
  readonly skillId: string
  readonly etiqueta: string
  readonly notaMinima: number
}

export interface CoberturaNotaColaboradorSkill {
  readonly skillId: string
  readonly nota: number | null
  readonly nivel: NivelCualitativoArea
}

export interface CoberturaColaboradorItem {
  readonly id: string
  readonly nombre: string
  readonly email: string
  readonly porcentajeAvance: number
  readonly estadoAsignacion: string | null
  /** Promedio de notas (ignora null) — para ordenar/destacar. */
  readonly promedioNota: number | null
  /** Cuantas skills exigidas estan en `excelencia` o `solido`. */
  readonly skillsCumplidas: number
  /** Cuantas skills exigidas estan en `inicial`, `enDesarrollo` o `sinTocar`. */
  readonly skillsEnBrecha: number
  readonly notas: readonly CoberturaNotaColaboradorSkill[]
}

export interface CoberturaResumenAgregado {
  /** Promedio del curso por skill (ignora null). */
  readonly promedioPorSkill: ReadonlyArray<{
    readonly skillId: string
    readonly promedio: number | null
  }>
  /** Conteo de colaboradores por nivel cualitativo agregado. */
  readonly conteoNiveles: {
    readonly excelencia: number
    readonly solido: number
    readonly enDesarrollo: number
    readonly inicial: number
    readonly sinTocar: number
  }
}

export interface CoberturaCursoResponse {
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly skills: readonly CoberturaSkillExigida[]
  readonly colaboradores: readonly CoberturaColaboradorItem[]
  readonly resumen: CoberturaResumenAgregado
  readonly meta: { readonly frescura: string }
}
