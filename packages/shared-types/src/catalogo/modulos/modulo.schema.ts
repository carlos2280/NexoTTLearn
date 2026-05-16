import { z } from "zod"

/**
 * Schema de creacion de modulo (POST /api/v1/catalogo/modulos).
 * `descripcion` opcional; ambos limites alineados con §3.5.
 */
export const crearModuloSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200),
    descripcion: z.string().trim().max(2000).optional(),
  })
  .strict()

export type CrearModuloInput = z.infer<typeof crearModuloSchema>

/**
 * Schema de actualizacion (PATCH /api/v1/catalogo/modulos/:id).
 * `descripcion: null` permite limpiar el campo. Exige al menos un campo.
 * Motivo se exige a nivel de service SOLO si cambia `titulo`.
 */
export const actualizarModuloSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200).optional(),
    descripcion: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((v) => v.titulo !== undefined || v.descripcion !== undefined, {
    message: "Debe incluir al menos un campo a actualizar.",
  })

export type ActualizarModuloInput = z.infer<typeof actualizarModuloSchema>

/**
 * Impacto que reporta `POST /api/v1/catalogo/modulos/:id/archivar` (D-CAT-13).
 * `cursosActivosAfectados` lista los cursos en estado ACTIVO que tenian el modulo
 * habilitado. `skillsHuerfanas` lista las skills exigidas que quedan sin cobertura
 * en al menos un curso tras el archivado.
 */
export interface CursoActivoAfectado {
  readonly cursoId: string
  readonly titulo: string
}

export interface SkillHuerfana {
  readonly skillId: string
  readonly etiquetaVisible: string
  readonly cursosDondeQuedaHuerfana: readonly string[]
}

export interface PreviewImpactoArchivoModulo {
  readonly cursosActivosAfectados: readonly CursoActivoAfectado[]
  readonly skillsHuerfanas: readonly SkillHuerfana[]
}
