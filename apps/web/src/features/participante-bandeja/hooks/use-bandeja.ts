import type { ParticipanteBandejaResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerBandeja } from "../api/obtener-bandeja.api"

export const PARTICIPANTE_BANDEJA_KEY = ["participante", "bandeja"] as const

export function useBandeja() {
  return useQuery<ParticipanteBandejaResponse>({
    queryKey: PARTICIPANTE_BANDEJA_KEY,
    queryFn: obtenerBandeja,
    staleTime: 30_000,
  })
}
