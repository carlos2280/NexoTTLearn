import type {
  ActualizarAreasCursoInput,
  ActualizarEntrevistaIaCursoInput,
  ActualizarModulosHabilitadosCursoInput,
  ActualizarPesosCursoInput,
  ActualizarSkillsExigidasCursoInput,
  ActualizarTransversalCursoInput,
  ActualizarUmbralesLogroCursoInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  actualizarAreasCurso,
  actualizarEntrevistaIaCurso,
  actualizarModulosHabilitadosCurso,
  actualizarPesosCurso,
  actualizarSkillsExigidasCurso,
  actualizarTransversalCurso,
  actualizarUmbralesLogroCurso,
} from "../api/cursos.api"
import { CURSOS_QUERY_KEY } from "./use-listar-cursos"

interface ArgsBase<T> {
  readonly cursoId: string
  readonly input: T
  readonly motivo: string | undefined
}

function useInvalidarTodo() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CURSOS_QUERY_KEY })
}

export function useActualizarAreasCurso() {
  const invalidar = useInvalidarTodo()
  return useMutation({
    mutationFn: ({ cursoId, input, motivo }: ArgsBase<ActualizarAreasCursoInput>) =>
      actualizarAreasCurso(cursoId, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useActualizarSkillsExigidasCurso() {
  const invalidar = useInvalidarTodo()
  return useMutation({
    mutationFn: ({ cursoId, input, motivo }: ArgsBase<ActualizarSkillsExigidasCursoInput>) =>
      actualizarSkillsExigidasCurso(cursoId, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useActualizarModulosHabilitadosCurso() {
  const invalidar = useInvalidarTodo()
  return useMutation({
    mutationFn: ({ cursoId, input, motivo }: ArgsBase<ActualizarModulosHabilitadosCursoInput>) =>
      actualizarModulosHabilitadosCurso(cursoId, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useActualizarPesosCurso() {
  const invalidar = useInvalidarTodo()
  return useMutation({
    mutationFn: ({ cursoId, input, motivo }: ArgsBase<ActualizarPesosCursoInput>) =>
      actualizarPesosCurso(cursoId, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useActualizarUmbralesLogroCurso() {
  const invalidar = useInvalidarTodo()
  return useMutation({
    mutationFn: ({ cursoId, input, motivo }: ArgsBase<ActualizarUmbralesLogroCursoInput>) =>
      actualizarUmbralesLogroCurso(cursoId, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useActualizarTransversalCurso() {
  const invalidar = useInvalidarTodo()
  return useMutation({
    mutationFn: ({ cursoId, input, motivo }: ArgsBase<ActualizarTransversalCursoInput>) =>
      actualizarTransversalCurso(cursoId, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useActualizarEntrevistaIaCurso() {
  const invalidar = useInvalidarTodo()
  return useMutation({
    mutationFn: ({ cursoId, input, motivo }: ArgsBase<ActualizarEntrevistaIaCursoInput>) =>
      actualizarEntrevistaIaCurso(cursoId, input, motivo),
    onSuccess: () => invalidar(),
  })
}
