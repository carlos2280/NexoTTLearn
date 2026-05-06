import { httpClient } from "@/shared/api/http-client"
import { z } from "zod"

const eliminarSeccionResponseSchema = z.object({ ok: z.literal(true) })
export type EliminarSeccionResponse = z.infer<typeof eliminarSeccionResponseSchema>

export async function eliminarSeccionAdmin(
  cursoId: string,
  moduloId: string,
  seccionId: string,
): Promise<EliminarSeccionResponse> {
  const data = await httpClient.delete<EliminarSeccionResponse>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}/secciones/${seccionId}`,
  )
  return eliminarSeccionResponseSchema.parse(data)
}
