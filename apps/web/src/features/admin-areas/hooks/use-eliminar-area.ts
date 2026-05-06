import type { AreaDeleteResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { eliminarArea } from "../api/eliminar-area.api"
import { ADMIN_AREAS_KEY } from "./use-areas"

export function useEliminarArea() {
  const qc = useQueryClient()
  return useMutation<AreaDeleteResponse, Error, string>({
    mutationFn: eliminarArea,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_AREAS_KEY })
    },
  })
}
