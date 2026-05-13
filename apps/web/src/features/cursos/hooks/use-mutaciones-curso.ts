import type {
  ActualizarCursoInput,
  CerrarCursoInput,
  CrearCursoInput,
  DuplicarCursoInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  actualizarCurso,
  archivarCurso,
  cerrarCurso,
  crearCurso,
  desarchivarCurso,
  deshacerCierreCurso,
  duplicarCurso,
  eliminarCurso,
  publicarCurso,
} from "../api/cursos.api"
import { CURSOS_QUERY_KEY } from "./use-listar-cursos"

function useInvalidar() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CURSOS_QUERY_KEY })
}

export function useCrearCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (input: CrearCursoInput) => crearCurso(input),
    onSuccess: () => invalidar(),
  })
}

interface ActualizarArgs {
  readonly id: string
  readonly input: ActualizarCursoInput
  readonly motivo: string | undefined
}

export function useActualizarCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, input, motivo }: ActualizarArgs) => actualizarCurso(id, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useEliminarCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (id: string) => eliminarCurso(id),
    onSuccess: () => invalidar(),
  })
}

interface PublicarArgs {
  readonly id: string
  readonly motivo: string | undefined
}

export function usePublicarCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo }: PublicarArgs) => publicarCurso(id, motivo),
    onSuccess: () => invalidar(),
  })
}

interface ArchivarArgs {
  readonly id: string
  readonly motivo: string
}

export function useArchivarCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo }: ArchivarArgs) => archivarCurso(id, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useDesarchivarCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: (id: string) => desarchivarCurso(id),
    onSuccess: () => invalidar(),
  })
}

interface DuplicarArgs {
  readonly id: string
  readonly input: DuplicarCursoInput
  readonly motivo: string
}

export function useDuplicarCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, input, motivo }: DuplicarArgs) => duplicarCurso(id, input, motivo),
    onSuccess: () => invalidar(),
  })
}

interface CerrarArgs {
  readonly id: string
  readonly input: CerrarCursoInput
  readonly motivo: string
  readonly idempotencyKey: string
}

export function useCerrarCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, input, motivo, idempotencyKey }: CerrarArgs) =>
      cerrarCurso(id, input, motivo, idempotencyKey),
    onSuccess: () => invalidar(),
  })
}

interface DeshacerCierreArgs {
  readonly id: string
  readonly motivo: string
  readonly idempotencyKey: string
}

export function useDeshacerCierreCurso() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, motivo, idempotencyKey }: DeshacerCierreArgs) =>
      deshacerCierreCurso(id, motivo, idempotencyKey),
    onSuccess: () => invalidar(),
  })
}
