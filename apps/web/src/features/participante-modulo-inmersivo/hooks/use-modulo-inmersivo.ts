import type { ModuloInmersivoResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerModuloInmersivo } from "../api/obtener-modulo-inmersivo.api"

export const PARTICIPANTE_MODULO_INMERSIVO_KEY = ["participante", "modulo-inmersivo"] as const

export function useModuloInmersivo(slug: string, moduloId: string) {
  return useQuery<ModuloInmersivoResponse>({
    queryKey: [...PARTICIPANTE_MODULO_INMERSIVO_KEY, slug, moduloId],
    queryFn: () => obtenerModuloInmersivo(slug, moduloId),
    staleTime: 30_000,
    enabled: slug.length > 0 && moduloId.length > 0,
  })
}
