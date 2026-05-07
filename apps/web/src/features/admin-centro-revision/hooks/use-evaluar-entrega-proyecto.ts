import { ajustarEntregaProyecto } from "@/features/admin-centro-revision/api/ajustar-entrega-proyecto.api"
import { evaluarEntregaProyecto } from "@/features/admin-centro-revision/api/evaluar-entrega-proyecto.api"
import type {
  AjustarEntregaProyectoAdminInput,
  EvaluarEntregaProyectoAdminInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ENTREGAS_PROYECTO_KEY, entregaProyectoDetalleQueryKey } from "./use-entregas-proyecto"

export function useEvaluarEntregaProyecto(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EvaluarEntregaProyectoAdminInput) => evaluarEntregaProyecto(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entregaProyectoDetalleQueryKey(id) })
      qc.invalidateQueries({ queryKey: ENTREGAS_PROYECTO_KEY })
    },
  })
}

export function useAjustarEntregaProyecto(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AjustarEntregaProyectoAdminInput) => ajustarEntregaProyecto(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entregaProyectoDetalleQueryKey(id) })
      qc.invalidateQueries({ queryKey: ENTREGAS_PROYECTO_KEY })
    },
  })
}
