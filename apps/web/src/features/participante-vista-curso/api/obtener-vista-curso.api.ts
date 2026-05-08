import { httpClient } from "@/shared/api/http-client"
import {
  type ParticipanteVistaCursoResponse,
  participanteVistaCursoResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerVistaCurso(slug: string): Promise<ParticipanteVistaCursoResponse> {
  const data = await httpClient.get<ParticipanteVistaCursoResponse>(
    `/participante/cursos/${encodeURIComponent(slug)}`,
  )
  const result = participanteVistaCursoResponseSchema.safeParse(data)
  if (!result.success) {
    console.error("[vista-curso] Zod parse falló", {
      slug,
      raw: data,
      issues: result.error.issues,
    })
    throw new Error(
      `Respuesta del back no cumple el contrato: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")} → ${i.message}`)
        .join(" · ")}`,
    )
  }
  return result.data
}
