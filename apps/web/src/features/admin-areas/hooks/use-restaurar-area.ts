import type { Area } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { restaurarArea } from "../api/restaurar-area.api"
import { ADMIN_AREAS_KEY } from "./use-areas"

export function useRestaurarArea() {
  const qc = useQueryClient()
  return useMutation<Area, Error, string>({
    mutationFn: restaurarArea,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_AREAS_KEY })
    },
  })
}
