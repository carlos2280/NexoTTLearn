import { httpClient } from "@/shared/api/http-client"
import { z } from "zod"

const eliminarModuloResponseSchema = z.object({ ok: z.literal(true) })
export type EliminarModuloResponse = z.infer<typeof eliminarModuloResponseSchema>

export async function eliminarModuloAdmin(
  cursoId: string,
  moduloId: string,
): Promise<EliminarModuloResponse> {
  const data = await httpClient.delete<EliminarModuloResponse>(
    `/admin/cursos/${cursoId}/modulos/${moduloId}`,
  )
  return eliminarModuloResponseSchema.parse(data)
}
