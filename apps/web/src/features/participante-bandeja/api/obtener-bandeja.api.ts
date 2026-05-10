import { httpClient } from "@/shared/api/http-client"
import {
  type ParticipanteBandejaResponse,
  participanteBandejaResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerBandeja(): Promise<ParticipanteBandejaResponse> {
  const data = await httpClient.get<ParticipanteBandejaResponse>("/participante/bandeja")
  return participanteBandejaResponseSchema.parse(data)
}
