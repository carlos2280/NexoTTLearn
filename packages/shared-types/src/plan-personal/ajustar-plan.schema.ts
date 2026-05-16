/**
 * Body de `PATCH /api/v1/asignaciones/:asignacionId/plan/ajustes` (Slice 7 P7c).
 *
 * Discriminated union por `accion` — un solo endpoint maneja las 4 acciones
 * del enum `AccionAjustePlan` (AGREGAR / QUITAR / EXIMIR / CAMBIAR_CARACTER).
 * Cada rama es `.strict()` para rechazar propiedades extra (defensa OWASP A01:
 * el cliente no puede falsificar `autorUsuarioId`, `motivo`, etc.).
 */
import { z } from "zod"

export const caracterAjustePlanSchema = z.enum(["OBLIGATORIA", "OPCIONAL"])
export type CaracterAjustePlan = z.infer<typeof caracterAjustePlanSchema>

export const accionAjustarPlanSchema = z.enum(["AGREGAR", "QUITAR", "EXIMIR", "CAMBIAR_CARACTER"])
export type AccionAjustarPlan = z.infer<typeof accionAjustarPlanSchema>

export const ajustarPlanSchema = z.discriminatedUnion("accion", [
  z
    .object({
      accion: z.literal("AGREGAR"),
      seccionId: z.string().uuid(),
      caracter: caracterAjustePlanSchema.default("OBLIGATORIA"),
    })
    .strict(),
  z
    .object({
      accion: z.literal("QUITAR"),
      seccionId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      accion: z.literal("EXIMIR"),
      skillId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      accion: z.literal("CAMBIAR_CARACTER"),
      seccionId: z.string().uuid(),
      caracter: caracterAjustePlanSchema,
    })
    .strict(),
])

export type AjustarPlanInput = z.infer<typeof ajustarPlanSchema>
