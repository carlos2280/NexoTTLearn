import type { CatalogoFichaResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerFicha } from "../api/obtener-ficha.api"
import { PARTICIPANTE_CATALOGO_KEY } from "./use-vitrina"

export function fichaCatalogoQueryKey(slug: string) {
  return [...PARTICIPANTE_CATALOGO_KEY, "ficha", slug] as const
}

export function useFichaCatalogo(slug: string) {
  return useQuery<CatalogoFichaResponse>({
    queryKey: fichaCatalogoQueryKey(slug),
    queryFn: () => obtenerFicha(slug),
    staleTime: 60_000,
    enabled: slug.length > 0,
  })
}
