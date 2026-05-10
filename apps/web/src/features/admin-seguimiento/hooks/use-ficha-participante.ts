import type { FichaParticipanteResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerFichaParticipante } from "../api/ficha.api"

export const FICHA_PARTICIPANTE_KEY = ["admin", "seguimiento", "ficha"] as const

export function fichaParticipanteQueryKey(participanteId: string) {
  return [...FICHA_PARTICIPANTE_KEY, participanteId] as const
}

export function useFichaParticipante(participanteId: string | undefined) {
  return useQuery<FichaParticipanteResponse>({
    queryKey: fichaParticipanteQueryKey(participanteId ?? ""),
    queryFn: () => obtenerFichaParticipante(participanteId as string),
    enabled: Boolean(participanteId),
    staleTime: 30_000,
  })
}
