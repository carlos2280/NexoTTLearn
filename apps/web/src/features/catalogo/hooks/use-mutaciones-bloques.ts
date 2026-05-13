import type {
  CrearBloqueInput,
  PatchBloqueInput,
  ReordenarBloquesInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { crearBloque, eliminarBloque, patchBloque, reordenarBloques } from "../api/bloques.api"
import { BLOQUES_QUERY_KEY } from "./use-listar-bloques"

function useInvalidar() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: BLOQUES_QUERY_KEY })
}

interface CrearArgs {
  readonly seccionId: string
  readonly input: CrearBloqueInput
}

export function useCrearBloque() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ seccionId, input }: CrearArgs) => crearBloque(seccionId, input),
    onSuccess: () => invalidar(),
  })
}

interface PatchArgs {
  readonly bloqueId: string
  readonly input: PatchBloqueInput
  readonly motivo?: string
}

export function usePatchBloque() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ bloqueId, input, motivo }: PatchArgs) => patchBloque(bloqueId, input, motivo),
    onSuccess: () => invalidar(),
  })
}

interface ReordenarArgs {
  readonly seccionId: string
  readonly input: ReordenarBloquesInput
}

export function useReordenarBloques() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ seccionId, input }: ReordenarArgs) => reordenarBloques(seccionId, input),
    onSuccess: () => invalidar(),
  })
}

interface EliminarArgs {
  readonly bloqueId: string
  readonly motivo: string
}

export function useEliminarBloque() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ bloqueId, motivo }: EliminarArgs) => eliminarBloque(bloqueId, motivo),
    onSuccess: () => invalidar(),
  })
}
