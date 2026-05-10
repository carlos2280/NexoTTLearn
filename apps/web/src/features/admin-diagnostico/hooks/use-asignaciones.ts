import type {
  AsignacionDeleteResponse,
  AsignacionesInscripcionResponse,
  CambiarTipoAsignacionInput,
  ConfirmarLoteInput,
  ConfirmarLoteResponse,
  MatrizAsignacionesQuery,
  MatrizAsignacionesResponse,
  ReemplazarAsignacionesInput,
} from "@nexott-learn/shared-types"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cambiarTipoAsignacion,
  confirmarLoteAsignaciones,
  eliminarAsignacion,
  obtenerAsignacionesInscripcion,
  obtenerMatrizAsignaciones,
  reemplazarAsignaciones,
} from "../api/asignaciones.api"

export const ASIGNACIONES_MATRIZ_KEY = ["admin", "diagnostico", "asignaciones-matriz"] as const
export const ASIGNACIONES_INSCRIPCION_KEY = [
  "admin",
  "diagnostico",
  "asignaciones-inscripcion",
] as const

export function asignacionesMatrizQueryKey(
  cursoId: string,
  query: Partial<MatrizAsignacionesQuery>,
) {
  return [...ASIGNACIONES_MATRIZ_KEY, cursoId, query] as const
}

export function useAsignacionesMatriz(
  cursoId: string | undefined,
  query: Partial<MatrizAsignacionesQuery> = {},
) {
  return useQuery<MatrizAsignacionesResponse>({
    queryKey: asignacionesMatrizQueryKey(cursoId ?? "", query),
    queryFn: () => obtenerMatrizAsignaciones(cursoId as string, query),
    enabled: Boolean(cursoId),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}

export function useAsignacionesInscripcion(inscripcionId: string | undefined) {
  return useQuery<AsignacionesInscripcionResponse>({
    queryKey: [...ASIGNACIONES_INSCRIPCION_KEY, inscripcionId ?? ""] as const,
    queryFn: () => obtenerAsignacionesInscripcion(inscripcionId as string),
    enabled: Boolean(inscripcionId),
    staleTime: 15_000,
  })
}

interface ReemplazarVars {
  readonly inscripcionId: string
  readonly input: ReemplazarAsignacionesInput
}

export function useReemplazarAsignaciones() {
  const qc = useQueryClient()
  return useMutation<AsignacionesInscripcionResponse, Error, ReemplazarVars>({
    mutationFn: ({ inscripcionId, input }) => reemplazarAsignaciones(inscripcionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASIGNACIONES_MATRIZ_KEY })
      qc.invalidateQueries({ queryKey: ASIGNACIONES_INSCRIPCION_KEY })
    },
  })
}

interface CambiarTipoVars {
  readonly inscripcionId: string
  readonly moduloId: string
  readonly input: CambiarTipoAsignacionInput
}

export function useCambiarTipoAsignacion() {
  const qc = useQueryClient()
  return useMutation<AsignacionesInscripcionResponse, Error, CambiarTipoVars>({
    mutationFn: ({ inscripcionId, moduloId, input }) =>
      cambiarTipoAsignacion(inscripcionId, moduloId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASIGNACIONES_MATRIZ_KEY })
      qc.invalidateQueries({ queryKey: ASIGNACIONES_INSCRIPCION_KEY })
    },
  })
}

interface EliminarVars {
  readonly inscripcionId: string
  readonly moduloId: string
}

export function useEliminarAsignacion() {
  const qc = useQueryClient()
  return useMutation<AsignacionDeleteResponse, Error, EliminarVars>({
    mutationFn: ({ inscripcionId, moduloId }) => eliminarAsignacion(inscripcionId, moduloId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASIGNACIONES_MATRIZ_KEY })
      qc.invalidateQueries({ queryKey: ASIGNACIONES_INSCRIPCION_KEY })
    },
  })
}

interface ConfirmarLoteVars {
  readonly cursoId: string
  readonly input: ConfirmarLoteInput
}

export function useConfirmarLoteAsignaciones() {
  const qc = useQueryClient()
  return useMutation<ConfirmarLoteResponse, Error, ConfirmarLoteVars>({
    mutationFn: ({ cursoId, input }) => confirmarLoteAsignaciones(cursoId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASIGNACIONES_MATRIZ_KEY })
      qc.invalidateQueries({ queryKey: ASIGNACIONES_INSCRIPCION_KEY })
    },
  })
}
