import { z } from "zod"

const REGEX_FORTALEZA_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, "La contrasena actual es obligatoria"),
  passwordNuevo: z
    .string()
    .min(10, "La nueva contrasena debe tener al menos 10 caracteres")
    .regex(
      REGEX_FORTALEZA_PASSWORD,
      "La nueva contrasena debe incluir mayusculas, minusculas y numeros",
    ),
})

export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>
