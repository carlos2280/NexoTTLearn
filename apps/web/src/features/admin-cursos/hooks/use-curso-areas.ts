import {
  actualizarCursoArea,
  agregarCursoArea,
  eliminarCursoArea,
  reemplazarCursoArea,
} from "@/features/admin-cursos/api/curso-areas.api"
import type {
  ActualizarCursoAreaInput,
  AgregarCursoAreaInput,
  ReemplazarCursoAreaInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminCursoDetalleQueryKey } from "./use-curso-detalle"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

function invalidaciones(qc: ReturnType<typeof useQueryClient>, cursoId: string) {
  qc.invalidateQueries({ queryKey: adminCursoDetalleQueryKey(cursoId) })
  qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
}

export function useAgregarCursoArea(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AgregarCursoAreaInput) => agregarCursoArea(cursoId, input),
    onSuccess: () => invalidaciones(qc, cursoId),
  })
}

export function useActualizarCursoArea(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { cursoAreaId: string; input: ActualizarCursoAreaInput }) =>
      actualizarCursoArea(cursoId, vars.cursoAreaId, vars.input),
    onSuccess: () => invalidaciones(qc, cursoId),
  })
}

export function useReemplazarCursoArea(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { cursoAreaId: string; input: ReemplazarCursoAreaInput }) =>
      reemplazarCursoArea(cursoId, vars.cursoAreaId, vars.input),
    onSuccess: () => invalidaciones(qc, cursoId),
  })
}

export function useEliminarCursoArea(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cursoAreaId: string) => eliminarCursoArea(cursoId, cursoAreaId),
    onSuccess: () => invalidaciones(qc, cursoId),
  })
}
