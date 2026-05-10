import type { CrearCursoInput, CursoDetalle } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { crearCurso } from "../api/crear-curso.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function useCrearCurso() {
  const qc = useQueryClient()
  return useMutation<CursoDetalle, Error, CrearCursoInput>({
    mutationFn: crearCurso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
