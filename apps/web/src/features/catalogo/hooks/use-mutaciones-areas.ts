import type { ActualizarAreaInput, CrearAreaInput } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarArea, crearArea, eliminarArea } from "../api/areas.api"
import { AREAS_QUERY_KEY } from "./use-listar-areas"

export function useCrearArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearAreaInput) => crearArea(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AREAS_QUERY_KEY })
    },
  })
}

export function useActualizarArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { readonly id: string; readonly input: ActualizarAreaInput }) =>
      actualizarArea(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AREAS_QUERY_KEY })
    },
  })
}

export function useEliminarArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eliminarArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AREAS_QUERY_KEY })
    },
  })
}
