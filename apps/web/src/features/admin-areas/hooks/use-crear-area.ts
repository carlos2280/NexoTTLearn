import type { Area, CrearAreaInput } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { crearArea } from "../api/crear-area.api"
import { ADMIN_AREAS_KEY } from "./use-areas"

export function useCrearArea() {
  const qc = useQueryClient()
  return useMutation<Area, Error, CrearAreaInput>({
    mutationFn: crearArea,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_AREAS_KEY })
    },
  })
}
