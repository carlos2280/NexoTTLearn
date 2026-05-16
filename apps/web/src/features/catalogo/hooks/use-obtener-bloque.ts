import { useQuery } from "@tanstack/react-query"
import { obtenerBloque } from "../api/bloques.api"
import { BLOQUES_QUERY_KEY } from "./use-listar-bloques"

export function useObtenerBloque(bloqueId: string | undefined) {
  return useQuery({
    queryKey: [...BLOQUES_QUERY_KEY, "obtener", bloqueId] as const,
    queryFn: () => {
      if (!bloqueId) {
        throw new Error("bloqueId requerido")
      }
      return obtenerBloque(bloqueId)
    },
    enabled: Boolean(bloqueId),
    staleTime: 15_000,
  })
}
