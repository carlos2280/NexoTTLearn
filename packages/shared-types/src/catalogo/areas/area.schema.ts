import { z } from "zod"

/**
 * Schema de creacion de area (POST /api/v1/catalogo/areas).
 * `nombre` se trim antes de validar longitud; `descripcion` opcional y
 * tambien trim. Ambos limites alineados con el modelo fisico (§3.1).
 */
export const crearAreaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(200),
    descripcion: z.string().trim().max(2000).optional(),
  })
  .strict()

export type CrearAreaInput = z.infer<typeof crearAreaSchema>

/**
 * Schema de actualizacion (PATCH /api/v1/catalogo/areas/:id).
 * `.strict()` rechaza campos desconocidos. `refine` exige al menos un campo.
 */
export const actualizarAreaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(200).optional(),
    descripcion: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((v) => v.nombre !== undefined || v.descripcion !== undefined, {
    message: "Debe incluir al menos un campo a actualizar.",
  })

export type ActualizarAreaInput = z.infer<typeof actualizarAreaSchema>
