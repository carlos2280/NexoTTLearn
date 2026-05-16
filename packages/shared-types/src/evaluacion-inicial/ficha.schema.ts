import { z } from "zod"

/**
 * Replica del enum Prisma `OrigenNotaSkill`. Mantener sincronizado.
 */
export const origenNotaSkillSchema = z.enum([
  "ENTREVISTA_INICIAL",
  "BLOQUE",
  "TRANSVERSAL",
  "ENTREVISTA_IA",
  "MANUAL",
])
export type OrigenNotaSkill = z.infer<typeof origenNotaSkillSchema>

/**
 * Item de la ficha por skill (`GET /colaboradores/:id/ficha`).
 *
 * `notaActual` puede ser `null` (sin evidencia) y nunca debe confundirse con
 * `0`. Igual aplica a `origenActual`. `etiquetaCualitativa` se omite por ahora:
 * los umbrales viven a nivel de curso (`Curso.umbralesLogro`) y la ficha es
 * global, sin contexto de curso. La etiqueta se reintroducira en S11/S12
 * cuando se vincule la ficha al avance por curso.
 */
export interface FichaSkillItem {
  readonly skillId: string
  readonly etiquetaVisible: string
  readonly areaId: string
  readonly areaNombre: string
  readonly notaActual: number | null
  readonly origenActual: Record<string, unknown> | null
}

export interface FichaPorAreaItem {
  readonly areaId: string
  readonly nombre: string
  readonly promedio: number | null
  readonly skillsConNota: number
  readonly skillsTotales: number
}

export interface FichaResponse {
  readonly colaboradorId: string
  readonly skills: readonly FichaSkillItem[]
  readonly porArea: readonly FichaPorAreaItem[]
}

/**
 * Entrada del historico de una skill especifica. Append-only desde
 * `historico_notas_skill`. `valor` puede ser null para representar la marca
 * "sin evidencia" cuando una edicion manual reseteo la nota.
 */
export interface EntradaHistoricoNotaSkill {
  readonly id: string
  readonly fecha: string
  readonly valor: number | null
  readonly origen: OrigenNotaSkill
  readonly referencia: Record<string, unknown> | null
  readonly autorUsuarioId: string | null
}
