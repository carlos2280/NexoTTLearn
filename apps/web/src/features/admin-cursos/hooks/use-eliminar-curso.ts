import type { CursoDeleteResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { eliminarCurso } from "../api/eliminar-curso.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function useEliminarCurso() {
  const qc = useQueryClient()
  return useMutation<CursoDeleteResponse, Error, string>({
    mutationFn: eliminarCurso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
