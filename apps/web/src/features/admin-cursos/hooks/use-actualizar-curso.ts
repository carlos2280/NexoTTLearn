import { actualizarCurso } from "@/features/admin-cursos/api/actualizar-curso.api"
import type { ActualizarCursoInput } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { adminCursoDetalleQueryKey } from "./use-curso-detalle"
import { ADMIN_CURSOS_KEY } from "./use-cursos"

export function useActualizarCurso(cursoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ActualizarCursoInput) => actualizarCurso(cursoId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminCursoDetalleQueryKey(cursoId) })
      qc.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
