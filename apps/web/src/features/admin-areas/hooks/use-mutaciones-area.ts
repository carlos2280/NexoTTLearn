import type {
  ActualizarAreaInput,
  AreaConContadores,
  AreaDeleteResponse,
  CrearAreaInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarArea, crearArea, eliminarArea, restaurarArea } from "../api/mutaciones-area.api"
import { ADMIN_AREAS_KEY } from "./use-areas"

interface ActualizarVars {
  readonly id: string
  readonly input: ActualizarAreaInput
}

function useInvalidarAreas() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ADMIN_AREAS_KEY })
}

export function useCrearArea() {
  const invalidar = useInvalidarAreas()
  return useMutation<AreaConContadores, Error, CrearAreaInput>({
    mutationFn: crearArea,
    onSuccess: invalidar,
  })
}

export function useActualizarArea() {
  const invalidar = useInvalidarAreas()
  return useMutation<AreaConContadores, Error, ActualizarVars>({
    mutationFn: ({ id, input }) => actualizarArea(id, input),
    onSuccess: invalidar,
  })
}

export function useEliminarArea() {
  const invalidar = useInvalidarAreas()
  return useMutation<AreaDeleteResponse, Error, string>({
    mutationFn: eliminarArea,
    onSuccess: invalidar,
  })
}

export function useRestaurarArea() {
  const invalidar = useInvalidarAreas()
  return useMutation<AreaConContadores, Error, string>({
    mutationFn: restaurarArea,
    onSuccess: invalidar,
  })
}
