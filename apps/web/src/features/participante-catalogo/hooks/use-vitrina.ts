import type { CatalogoVitrinaQuery, CatalogoVitrinaResponse } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerVitrina } from "../api/obtener-vitrina.api"

export const PARTICIPANTE_CATALOGO_KEY = ["participante", "catalogo"] as const

export function vitrinaQueryKey(query: CatalogoVitrinaQuery) {
  return [
    ...PARTICIPANTE_CATALOGO_KEY,
    "vitrina",
    {
      q: query.q ?? "",
      area: query.area ?? "",
      duracion: query.duracion ?? "",
      cursor: query.cursor ?? "",
      limite: query.limite ?? 18,
    },
  ] as const
}

export function useVitrina(query: CatalogoVitrinaQuery) {
  return useQuery<CatalogoVitrinaResponse>({
    queryKey: vitrinaQueryKey(query),
    queryFn: () => obtenerVitrina(query),
    staleTime: 30_000,
  })
}
