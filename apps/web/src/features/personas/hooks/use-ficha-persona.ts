import { useQuery } from "@tanstack/react-query"
import { obtenerFichaColaborador } from "../api/colaboradores.api"
import { PERSONAS_QUERY_KEY } from "./use-listar-personas"

export function useFichaPersona(colaboradorId: string | null) {
  return useQuery({
    queryKey: [...PERSONAS_QUERY_KEY, "ficha", colaboradorId] as const,
    queryFn: () => obtenerFichaColaborador(colaboradorId ?? ""),
    enabled: Boolean(colaboradorId),
    staleTime: 30_000,
  })
}
