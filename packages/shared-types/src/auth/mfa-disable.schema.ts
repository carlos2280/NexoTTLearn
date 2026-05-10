import { z } from "zod"

/**
 * Disable de MFA admite dos modos exclusivos:
 *  - Auto-disable del propio usuario: { codigo }.
 *  - Disable administrativo de otro usuario: { usuarioId } + header X-Motivo.
 *
 * El service decide el modo segun el rol del caller; el schema solo asegura que
 * exactamente uno de los dos campos venga.
 */
export const mfaDisableSchema = z
  .object({
    codigo: z
      .string()
      .regex(/^\d{6}$/u, "El codigo MFA debe ser de 6 digitos numericos")
      .optional(),
    usuarioId: z.string().uuid("usuarioId debe ser un UUID").optional(),
  })
  .refine(
    (data) => Boolean(data.codigo) !== Boolean(data.usuarioId),
    "Se requiere exactamente uno: 'codigo' (auto-disable) o 'usuarioId' (admin).",
  )

export type MfaDisableInput = z.infer<typeof mfaDisableSchema>
