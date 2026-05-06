import type { ActualizarAreaInput, Area } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarArea } from "../api/actualizar-area.api"
import { ADMIN_AREAS_KEY } from "./use-areas"

interface ActualizarAreaParams {
  readonly id: string
  readonly input: ActualizarAreaInput
}

export function useActualizarArea() {
  const qc = useQueryClient()
  return useMutation<Area, Error, ActualizarAreaParams>({
    mutationFn: ({ id, input }) => actualizarArea(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_AREAS_KEY })
    },
  })
}
