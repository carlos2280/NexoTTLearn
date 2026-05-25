import { z } from "zod"

/**
 * PATCH /api/v1/cursos/:id/areas — actualiza la lista completa de areas
 * exigidas. Reglas (D-CUR-5): suma de pesos = 100, cada peso/puntajeObjetivo
 * en [0,100]. La validacion de suma se duplica en el service (toFixed(2)
 * exacto) para devolver `VALIDACION_PESO_NO_SUMA_100` con `details.sumaActual`.
 */
export const actualizarAreasCursoSchema = z
  .object({
    areas: z
      .array(
        z
          .object({
            areaId: z.string().uuid(),
            peso: z.number().min(0).max(100),
            puntajeObjetivo: z.number().min(0).max(100),
          })
          .strict(),
      )
      .min(1, "Debe declarar al menos un area exigida.")
      .max(50),
  })
  .strict()
  .refine(
    (v) => {
      const ids = v.areas.map((a) => a.areaId)
      return new Set(ids).size === ids.length
    },
    { message: "areaId duplicado en la lista de areas.", path: ["areas"] },
  )

export type ActualizarAreasCursoInput = z.infer<typeof actualizarAreasCursoSchema>
