/**
 * Tipos de la respuesta de `POST .../evaluacion-inicial/preview` (D-EVI-2,
 * D-EVI-6, D-EVI-8). El contrato HTTP completo vive en
 * `docs/NexoTTLearn/05_api/endpoints/evaluacion-inicial.md`.
 *
 * Schemas Zod adicionales para validar resumen/cambios/rechazos antes de
 * persistirlos en columnas Json del modelo `PreviewEvaluacionInicial`
 * (FIX-P5b-alineacion §5.60 — elimina el triple cast `as unknown as
 * Prisma.InputJsonValue`).
 */

import { z } from "zod"

export type FuenteCambioPreview = "SKILL_DIRECTA" | "AREA_HEREDADA"

export interface PreviewResumen {
  readonly filasTotales: number
  readonly filasValidas: number
  readonly filasRechazadas: number
  readonly skillsAfectadas: number
  readonly colaboradoresAfectados: number
}

export interface PreviewCambioItem {
  readonly colaboradorId: string
  readonly email: string
  readonly nombreColaborador: string
  readonly skillId: string
  readonly etiquetaSkill: string
  readonly valorAnterior: number | null
  readonly valorNuevo: number | null
  readonly fuente: FuenteCambioPreview
}

export interface PreviewErrorCelda {
  readonly celda: string
  readonly codigo: string
  readonly mensaje: string
}

export interface PreviewRechazoItem {
  readonly fila: number
  readonly email: string | null
  readonly errores: readonly PreviewErrorCelda[]
}

export interface PreviewResponse {
  readonly previewId: string
  readonly expiraEn: string
  readonly archivoId: string
  readonly resumen: PreviewResumen
  readonly cambios: readonly PreviewCambioItem[]
  readonly rechazos: readonly PreviewRechazoItem[]
}

export const fuenteCambioPreviewSchema = z.enum(["SKILL_DIRECTA", "AREA_HEREDADA"])

export const previewResumenSchema = z
  .object({
    filasTotales: z.number().int().nonnegative(),
    filasValidas: z.number().int().nonnegative(),
    filasRechazadas: z.number().int().nonnegative(),
    skillsAfectadas: z.number().int().nonnegative(),
    colaboradoresAfectados: z.number().int().nonnegative(),
  })
  .strict()

export const previewCambioItemSchema = z
  .object({
    colaboradorId: z.string().min(1),
    email: z.string().email().or(z.literal("")),
    nombreColaborador: z.string(),
    skillId: z.string().min(1),
    etiquetaSkill: z.string(),
    valorAnterior: z.number().min(0).max(100).nullable(),
    valorNuevo: z.number().min(0).max(100).nullable(),
    fuente: fuenteCambioPreviewSchema,
  })
  .strict()

export const previewErrorCeldaSchema = z
  .object({
    celda: z.string(),
    codigo: z.string(),
    mensaje: z.string(),
  })
  .strict()

export const previewRechazoItemSchema = z
  .object({
    fila: z.number().int().positive(),
    email: z.string().nullable(),
    errores: z.array(previewErrorCeldaSchema),
  })
  .strict()

export const previewCambiosArraySchema = z.array(previewCambioItemSchema)
export const previewRechazosArraySchema = z.array(previewRechazoItemSchema)
