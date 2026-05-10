import {
  actualizarProyectoTransversal,
  ajustarPesosProyectoTransversal,
  ajustarUmbralProyectoTransversal,
  eliminarProyectoTransversal,
  upsertProyectoTransversal,
} from "@/features/admin-cursos/api/upsert-proyecto-transversal.api"
import type {
  ActualizarProyectoTransversalAdminInput,
  AjustarPesosProyectoTransversalInput,
  AjustarUmbralProyectoTransversalInput,
  ProyectoTransversalDetalleAdmin,
  UpsertProyectoTransversalAdminInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { obtenerProyectoTransversal } from "../api/obtener-proyecto-transversal.api"
import { adminCursoDetalleQueryKey } from "./use-curso-detalle"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function adminProyectoTransversalQueryKey(cursoId: string) {
  return [...ADMIN_CURSOS_KEY, "proyecto-transversal", cursoId] as const
}

export function useProyectoTransversal(cursoId: string | undefined, enabled = true) {
  return useQuery<ProyectoTransversalDetalleAdmin | null>({
    queryKey: adminProyectoTransversalQueryKey(cursoId ?? ""),
    queryFn: () => obtenerProyectoTransversal(cursoId as string),
    enabled: Boolean(cursoId) && enabled,
    staleTime: 30_000,
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, cursoId: string) {
  qc.invalidateQueries({ queryKey: adminProyectoTransversalQueryKey(cursoId) })
  qc.invalidateQueries({ queryKey: adminCursoDetalleQueryKey(cursoId) })
}

export function useUpsertProyectoTransversal(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertProyectoTransversalAdminInput) =>
      upsertProyectoTransversal(cursoId, input),
    onSuccess: (data) => {
      qc.setQueryData(adminProyectoTransversalQueryKey(cursoId), data)
      invalidate(qc, cursoId)
    },
  })
}

export function useActualizarProyectoTransversal(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarProyectoTransversalAdminInput) =>
      actualizarProyectoTransversal(cursoId, input),
    onSuccess: (data) => {
      qc.setQueryData(adminProyectoTransversalQueryKey(cursoId), data)
    },
  })
}

export function useAjustarPesosProyectoTransversal(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AjustarPesosProyectoTransversalInput) =>
      ajustarPesosProyectoTransversal(cursoId, input),
    onSuccess: (data) => {
      qc.setQueryData(adminProyectoTransversalQueryKey(cursoId), data)
    },
  })
}

export function useAjustarUmbralProyectoTransversal(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AjustarUmbralProyectoTransversalInput) =>
      ajustarUmbralProyectoTransversal(cursoId, input),
    onSuccess: (data) => {
      qc.setQueryData(adminProyectoTransversalQueryKey(cursoId), data)
    },
  })
}

export function useEliminarProyectoTransversal(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => eliminarProyectoTransversal(cursoId),
    onSuccess: () => {
      qc.setQueryData(adminProyectoTransversalQueryKey(cursoId), null)
      invalidate(qc, cursoId)
    },
  })
}
