import type { HubDiagnosticoResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerHubDiagnostico } from "../api/hub.api"

export const HUB_DIAGNOSTICO_KEY = ["admin", "diagnostico", "hub"] as const

export function useHubDiagnostico() {
  return useQuery<HubDiagnosticoResponse>({
    queryKey: HUB_DIAGNOSTICO_KEY,
    queryFn: obtenerHubDiagnostico,
    staleTime: 15_000,
  })
}
