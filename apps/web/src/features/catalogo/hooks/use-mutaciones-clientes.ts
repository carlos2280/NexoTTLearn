import type { ActualizarClienteInput, CrearClienteInput } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarCliente, crearCliente, eliminarCliente } from "../api/clientes.api"
import { CLIENTES_QUERY_KEY } from "./use-listar-clientes"

function useInvalidar() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CLIENTES_QUERY_KEY })
}

export function useCrearCliente() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (input: CrearClienteInput) => crearCliente(input),
    onSuccess: () => invalidar(),
  })
}

interface ActualizarArgs {
  readonly id: string
  readonly input: ActualizarClienteInput
  readonly motivo: string | undefined
}

export function useActualizarCliente() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, input, motivo }: ActualizarArgs) => actualizarCliente(id, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useEliminarCliente() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo }: { readonly id: string; readonly motivo: string }) =>
      eliminarCliente(id, motivo),
    onSuccess: () => invalidar(),
  })
}
