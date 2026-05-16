import { z } from "zod"

/**
 * Body de `POST /api/v1/cursos/:id/duplicar`. Si `clienteId` se omite, el
 * service copia el cliente del curso fuente (D-CUR-10).
 */
export const duplicarCursoSchema = z
  .object({
    tituloNuevo: z.string().trim().min(1).max(200),
    clienteId: z.string().uuid().optional(),
  })
  .strict()

export type DuplicarCursoInput = z.infer<typeof duplicarCursoSchema>
