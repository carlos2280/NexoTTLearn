import { z } from "zod"

/**
 * Creacion de cliente (POST /api/v1/catalogo/clientes).
 * `datosContacto` se persiste como JSONB libre; el contrato HTTP no lo
 * estructura. El service rechaza nombre duplicado via unique de BD.
 */
export const crearClienteSchema = z
  .object({
    nombre: z.string().trim().min(1).max(200),
    datosContacto: z.record(z.unknown()).optional(),
  })
  .strict()

export type CrearClienteInput = z.infer<typeof crearClienteSchema>

/**
 * Actualizacion (PATCH /api/v1/catalogo/clientes/:id).
 * Motivo se exige a nivel de service SOLO si cambia `nombre` o `activo`. Editar
 * unicamente `datosContacto` NO exige motivo (sin riesgo legal/auditable).
 * `datosContacto: null` limpia el campo.
 */
export const actualizarClienteSchema = z
  .object({
    nombre: z.string().trim().min(1).max(200).optional(),
    datosContacto: z.record(z.unknown()).nullable().optional(),
    activo: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => v.nombre !== undefined || v.datosContacto !== undefined || v.activo !== undefined,
    { message: "Debe incluir al menos un campo a actualizar." },
  )

export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>
