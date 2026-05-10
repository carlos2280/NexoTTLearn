import {
  actualizarEntrevistaIa,
  eliminarEntrevistaIa,
  upsertEntrevistaIa,
} from "@/features/admin-cursos/api/upsert-entrevista-ia.api"
import type {
  ActualizarEntrevistaIAAdminInput,
  EntrevistaIADetalleAdmin,
  UpsertEntrevistaIAAdminInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { obtenerEntrevistaIa } from "../api/obtener-entrevista-ia.api"
import { adminCursoDetalleQueryKey } from "./use-curso-detalle"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function adminEntrevistaIaQueryKey(cursoId: string) {
  return [...ADMIN_CURSOS_KEY, "entrevista-ia", cursoId] as const
}

export function useEntrevistaIa(cursoId: string | undefined, enabled = true) {
  return useQuery<EntrevistaIADetalleAdmin | null>({
    queryKey: adminEntrevistaIaQueryKey(cursoId ?? ""),
    queryFn: () => obtenerEntrevistaIa(cursoId as string),
    enabled: Boolean(cursoId) && enabled,
    staleTime: 30_000,
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, cursoId: string) {
  qc.invalidateQueries({ queryKey: adminEntrevistaIaQueryKey(cursoId) })
  qc.invalidateQueries({ queryKey: adminCursoDetalleQueryKey(cursoId) })
}

export function useUpsertEntrevistaIa(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertEntrevistaIAAdminInput) => upsertEntrevistaIa(cursoId, input),
    onSuccess: (data) => {
      qc.setQueryData(adminEntrevistaIaQueryKey(cursoId), data)
      invalidate(qc, cursoId)
    },
  })
}

export function useActualizarEntrevistaIa(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarEntrevistaIAAdminInput) => actualizarEntrevistaIa(cursoId, input),
    onSuccess: (data) => {
      qc.setQueryData(adminEntrevistaIaQueryKey(cursoId), data)
    },
  })
}

export function useEliminarEntrevistaIa(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => eliminarEntrevistaIa(cursoId),
    onSuccess: () => {
      qc.setQueryData(adminEntrevistaIaQueryKey(cursoId), null)
      invalidate(qc, cursoId)
    },
  })
}
