import { z } from "zod"

/**
 * Creacion de seccion (POST /api/v1/catalogo/modulos/:moduloId/secciones).
 * `orden` opcional: si se omite, el service asigna max(orden) + 1 dentro del tx.
 * `skillIds` opcional; si viene, el service valida existencia + estado ACTIVA.
 */
export const crearSeccionSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200),
    orden: z.number().int().min(1).max(10_000).optional(),
    skillIds: z.array(z.string().uuid()).max(50).optional(),
  })
  .strict()

export type CrearSeccionInput = z.infer<typeof crearSeccionSchema>

/**
 * Actualizacion (PATCH /api/v1/catalogo/modulos/:moduloId/secciones/:seccionId).
 * `skillIds` se interpreta como REEMPLAZO completo del set (no parcial). Para
 * preservar las skills actuales, omitir el campo.
 */
export const actualizarSeccionSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200).optional(),
    skillIds: z.array(z.string().uuid()).max(50).optional(),
  })
  .strict()
  .refine((v) => v.titulo !== undefined || v.skillIds !== undefined, {
    message: "Debe incluir al menos un campo a actualizar.",
  })

export type ActualizarSeccionInput = z.infer<typeof actualizarSeccionSchema>

/**
 * Reordenar secciones (POST /api/v1/catalogo/modulos/:moduloId/secciones/orden).
 * Debe ser una permutacion completa de las secciones del modulo:
 *  - `seccionId` unicos
 *  - `orden` unicos
 *  - `orden` en [1, N]
 * El service ademas valida que el set de `seccionId` coincide exactamente con
 * las secciones del modulo (en BD).
 */
export const reordenarSeccionesSchema = z
  .object({
    orden: z
      .array(
        z
          .object({
            seccionId: z.string().uuid(),
            orden: z.number().int().min(1).max(10_000),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict()
  .refine(
    (v) => {
      const ids = new Set(v.orden.map((o) => o.seccionId))
      return ids.size === v.orden.length
    },
    { message: "seccionId duplicado en la permutacion." },
  )
  .refine(
    (v) => {
      const ordenes = new Set(v.orden.map((o) => o.orden))
      return ordenes.size === v.orden.length
    },
    { message: "orden duplicado en la permutacion." },
  )
  .refine(
    (v) => {
      const ordenes = v.orden.map((o) => o.orden).sort((a, b) => a - b)
      return ordenes.every((o, idx) => o === idx + 1)
    },
    { message: "orden debe ser una permutacion contigua [1..N]." },
  )

export type ReordenarSeccionesInput = z.infer<typeof reordenarSeccionesSchema>
