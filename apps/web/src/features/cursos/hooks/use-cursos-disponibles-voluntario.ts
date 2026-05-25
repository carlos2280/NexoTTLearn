import type { ApiError } from "@/shared/api/api-error"
import type { CursoDisponibleVoluntario, Paginated } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { listarCursosDisponiblesVoluntario } from "../api/listar-disponibles-voluntario.api"

const CURSOS_DISPONIBLES_VOLUNTARIO_ROOT = ["cursos", "disponibles-voluntario"] as const

export const CURSOS_DISPONIBLES_VOLUNTARIO_KEYS = {
  root: CURSOS_DISPONIBLES_VOLUNTARIO_ROOT,
  pagina: (page: number, pageSize: number) =>
    [...CURSOS_DISPONIBLES_VOLUNTARIO_ROOT, { page, pageSize }] as const,
}

/** Backwards-compat: el ROOT sigue siendo invalidador valido (incluye paginas). */
export const CURSOS_DISPONIBLES_VOLUNTARIO_KEY = CURSOS_DISPONIBLES_VOLUNTARIO_ROOT

interface UseCursosDisponiblesVoluntarioParams {
  readonly page?: number
  readonly pageSize?: number
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 18

export function useCursosDisponiblesVoluntario(
  params: UseCursosDisponiblesVoluntarioParams = {},
): UseQueryResult<Paginated<CursoDisponibleVoluntario>, ApiError> {
  const page = params.page ?? DEFAULT_PAGE
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  return useQuery<Paginated<CursoDisponibleVoluntario>, ApiError>({
    queryKey: CURSOS_DISPONIBLES_VOLUNTARIO_KEYS.pagina(page, pageSize),
    queryFn: () => listarCursosDisponiblesVoluntario({ page, pageSize }),
    staleTime: 60_000,
  })
}
