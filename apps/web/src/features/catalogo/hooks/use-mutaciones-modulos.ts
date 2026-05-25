import type { ActualizarModuloInput, CrearModuloInput } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  actualizarModulo,
  archivarModulo,
  crearModulo,
  desarchivarModulo,
  eliminarModulo,
} from "../api/modulos.api"
import { MODULOS_QUERY_KEY } from "./use-listar-modulos"

function useInvalidar() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: MODULOS_QUERY_KEY })
}

export function useCrearModulo() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (input: CrearModuloInput) => crearModulo(input),
    onSuccess: () => invalidar(),
  })
}

interface ActualizarArgs {
  readonly id: string
  readonly input: ActualizarModuloInput
  readonly motivo: string | undefined
}

export function useActualizarModulo() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, input, motivo }: ActualizarArgs) => actualizarModulo(id, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useArchivarModulo() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo }: { readonly id: string; readonly motivo: string }) =>
      archivarModulo(id, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useDesarchivarModulo() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo }: { readonly id: string; readonly motivo: string }) =>
      desarchivarModulo(id, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useEliminarModulo() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo }: { readonly id: string; readonly motivo: string }) =>
      eliminarModulo(id, motivo),
    onSuccess: () => invalidar(),
  })
}
