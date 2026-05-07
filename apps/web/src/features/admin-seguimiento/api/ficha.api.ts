import { httpClient } from "@/shared/api/http-client"
import {
  type FichaParticipanteResponse,
  fichaParticipanteResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerFichaParticipante(
  participanteId: string,
): Promise<FichaParticipanteResponse> {
  const data = await httpClient.get<FichaParticipanteResponse>(
    `/admin/participantes/${participanteId}/ficha`,
  )
  return fichaParticipanteResponseSchema.parse(data)
}
