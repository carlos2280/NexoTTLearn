import type {
  AutoInscripcionRequest,
  CerrarCasoAsignadoRequest,
  CerrarCasoVoluntarioRequest,
  CrearAsignacionesBatchRequest,
  PatchResultadoEntrevistaRequest,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  autoInscribirseEnCurso,
  cerrarCasoAsignacion,
  convertirAAsignado,
  crearAsignacionesBatch,
  iniciarProgresoAsignacion,
  marcarListoAsignacion,
  reabrirCasoAsignacion,
  registrarResultadoEntrevistaCliente,
  retirarAsignacion,
} from "../api/asignaciones.api"
import { ASIGNACIONES_QUERY_KEY } from "./use-listar-asignaciones"

function useInvalidar() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ASIGNACIONES_QUERY_KEY })
}

interface CrearBatchArgs {
  readonly cursoId: string
  readonly input: CrearAsignacionesBatchRequest
}

export function useCrearAsignacionesBatch() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ cursoId, input }: CrearBatchArgs) => crearAsignacionesBatch(cursoId, input),
    onSuccess: () => invalidar(),
  })
}

interface MotivoArgs {
  readonly asignacionId: string
  readonly motivo: string
}

export function useConvertirAAsignado() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ asignacionId, motivo }: MotivoArgs) => convertirAAsignado(asignacionId, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useIniciarProgreso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (asignacionId: string) => iniciarProgresoAsignacion(asignacionId),
    onSuccess: () => invalidar(),
  })
}

export function useMarcarListo() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (asignacionId: string) => marcarListoAsignacion(asignacionId),
    onSuccess: () => invalidar(),
  })
}

interface CerrarCasoArgs {
  readonly asignacionId: string
  readonly body: CerrarCasoAsignadoRequest | CerrarCasoVoluntarioRequest
  readonly idempotencyKey: string
  readonly motivo?: string
}

export function useCerrarCaso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (args: CerrarCasoArgs) => cerrarCasoAsignacion(args),
    onSuccess: () => invalidar(),
  })
}

interface ReabrirArgs {
  readonly asignacionId: string
  readonly motivo: string
  readonly idempotencyKey: string
}

export function useReabrirCaso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (args: ReabrirArgs) => reabrirCasoAsignacion(args),
    onSuccess: () => invalidar(),
  })
}

export function useRetirarAsignacion() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ asignacionId, motivo }: MotivoArgs) => retirarAsignacion(asignacionId, motivo),
    onSuccess: () => invalidar(),
  })
}

interface ResultadoArgs {
  readonly asignacionId: string
  readonly input: PatchResultadoEntrevistaRequest
}

export function useRegistrarResultadoEntrevistaCliente() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ asignacionId, input }: ResultadoArgs) =>
      registrarResultadoEntrevistaCliente(asignacionId, input),
    onSuccess: () => invalidar(),
  })
}

interface AutoInscripcionArgs {
  readonly cursoId: string
  readonly input: AutoInscripcionRequest
}

export function useAutoInscribirseEnCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ cursoId, input }: AutoInscripcionArgs) => autoInscribirseEnCurso(cursoId, input),
    onSuccess: () => invalidar(),
  })
}
