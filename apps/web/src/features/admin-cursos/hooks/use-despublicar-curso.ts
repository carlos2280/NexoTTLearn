import type { CursoDetalle, TransicionEstadoCursoInput } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { despublicarCurso } from "../api/despublicar-curso.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

interface Variables {
  readonly id: string
  readonly input: TransicionEstadoCursoInput
}

export function useDespublicarCurso() {
  const qc = useQueryClient()
  return useMutation<CursoDetalle, Error, Variables>({
    mutationFn: ({ id, input }) => despublicarCurso(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
