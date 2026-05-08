// Schemas para flujo de carga Excel de evaluacion inicial.
// Endpoints: GET /admin/cursos/:cursoId/diagnostico/excel/plantilla,
// POST .../preview, POST .../confirmar. PR 3b.

import { z } from "zod"

// Una nota por area en una fila parseada. valor=null cuando la celda esta
// vacia (se interpreta como "no evaluado" y se omite al confirmar).
export const excelPreviewNotaSchema = z.object({
  areaId: z.string().uuid(),
  valor: z.number().nullable(),
})
export type ExcelPreviewNota = z.infer<typeof excelPreviewNotaSchema>

export const excelPreviewEstadoSchema = z.enum(["ok", "warning", "error"])
export type ExcelPreviewEstado = z.infer<typeof excelPreviewEstadoSchema>

// estado=ok: todas las notas validas. warning: algunas notas se capean a
// [0,100] o se omiten por formato. error: la fila no se aplicara (email
// desconocido, sin notas validas, etc.).
export const excelPreviewFilaSchema = z.object({
  email: z.string(),
  nombre: z.string(),
  notas: z.array(excelPreviewNotaSchema),
  estado: excelPreviewEstadoSchema,
  mensajes: z.array(z.string()),
})
export type ExcelPreviewFila = z.infer<typeof excelPreviewFilaSchema>

export const excelPreviewResumenSchema = z.object({
  ok: z.number().int().min(0),
  warnings: z.number().int().min(0),
  errores: z.number().int().min(0),
})
export type ExcelPreviewResumen = z.infer<typeof excelPreviewResumenSchema>

export const excelPreviewResponseSchema = z.object({
  filas: z.array(excelPreviewFilaSchema),
  resumen: excelPreviewResumenSchema,
  uploadId: z.string().uuid(),
})
export type ExcelPreviewResponse = z.infer<typeof excelPreviewResponseSchema>

export const excelConfirmarBodySchema = z
  .object({
    uploadId: z.string().uuid(),
  })
  .strict()
export type ExcelConfirmarBody = z.infer<typeof excelConfirmarBodySchema>

export const excelConfirmarResponseSchema = z.object({
  aplicadas: z.number().int().min(0),
  ignoradas: z.number().int().min(0),
})
export type ExcelConfirmarResponse = z.infer<typeof excelConfirmarResponseSchema>
