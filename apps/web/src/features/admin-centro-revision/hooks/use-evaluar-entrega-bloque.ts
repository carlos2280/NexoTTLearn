import { ajustarEntregaBloque } from "@/features/admin-centro-revision/api/ajustar-entrega-bloque.api"
import { evaluarEntregaBloque } from "@/features/admin-centro-revision/api/evaluar-entrega-bloque.api"
import type {
  AjustarEntregaBloqueAdminInput,
  EvaluarEntregaBloqueAdminInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ENTREGAS_BLOQUE_KEY, entregaBloqueDetalleQueryKey } from "./use-entregas-bloque"

export function useEvaluarEntregaBloque(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EvaluarEntregaBloqueAdminInput) => evaluarEntregaBloque(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entregaBloqueDetalleQueryKey(id) })
      qc.invalidateQueries({ queryKey: ENTREGAS_BLOQUE_KEY })
    },
  })
}

export function useAjustarEntregaBloque(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AjustarEntregaBloqueAdminInput) => ajustarEntregaBloque(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entregaBloqueDetalleQueryKey(id) })
      qc.invalidateQueries({ queryKey: ENTREGAS_BLOQUE_KEY })
    },
  })
}
