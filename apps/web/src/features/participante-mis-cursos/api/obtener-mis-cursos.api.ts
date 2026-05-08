import { httpClient } from "@/shared/api/http-client"
import {
  type ParticipanteMisCursosResponse,
  participanteMisCursosResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerMisCursos(): Promise<ParticipanteMisCursosResponse> {
  const data = await httpClient.get<ParticipanteMisCursosResponse>("/participante/cursos")
  return participanteMisCursosResponseSchema.parse(data)
}
