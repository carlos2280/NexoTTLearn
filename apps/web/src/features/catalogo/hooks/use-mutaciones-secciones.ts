import type {
  ActualizarSeccionInput,
  CrearSeccionInput,
  ReordenarSeccionesInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  actualizarSeccion,
  crearSeccion,
  eliminarSeccion,
  reordenarSecciones,
} from "../api/secciones.api"
import { SECCIONES_QUERY_KEY } from "./use-listar-secciones"

function useInvalidar() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: SECCIONES_QUERY_KEY })
}

interface CrearArgs {
  readonly moduloId: string
  readonly input: CrearSeccionInput
}

export function useCrearSeccion() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ moduloId, input }: CrearArgs) => crearSeccion(moduloId, input),
    onSuccess: () => invalidar(),
  })
}

interface ActualizarArgs {
  readonly moduloId: string
  readonly seccionId: string
  readonly input: ActualizarSeccionInput
}

export function useActualizarSeccion() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ moduloId, seccionId, input }: ActualizarArgs) =>
      actualizarSeccion(moduloId, seccionId, input),
    onSuccess: () => invalidar(),
  })
}

interface ReordenarArgs {
  readonly moduloId: string
  readonly input: ReordenarSeccionesInput
}

export function useReordenarSecciones() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ moduloId, input }: ReordenarArgs) => reordenarSecciones(moduloId, input),
    onSuccess: () => invalidar(),
  })
}

interface EliminarArgs {
  readonly moduloId: string
  readonly seccionId: string
  readonly motivo: string
}

export function useEliminarSeccion() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ moduloId, seccionId, motivo }: EliminarArgs) =>
      eliminarSeccion(moduloId, seccionId, motivo),
    onSuccess: () => invalidar(),
  })
}
