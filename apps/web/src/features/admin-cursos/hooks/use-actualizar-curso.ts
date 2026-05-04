import type { ActualizarCursoInput, CursoAdminDetalle } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarCursoAdmin } from "../api/actualizar-curso-admin.api"
import { adminCursoDetalleKey } from "./use-curso-admin"
import { ADMIN_CURSOS_KEY } from "./use-cursos-admin"

interface ActualizarCursoVariables {
  readonly id: string
  readonly input: ActualizarCursoInput
}

export function useActualizarCurso() {
  const queryClient = useQueryClient()

  return useMutation<CursoAdminDetalle, Error, ActualizarCursoVariables>({
    mutationFn: ({ id, input }) => actualizarCursoAdmin(id, input),
    onSuccess: (curso) => {
      // Refresca el detalle (cache en sync con BD) y la lista (titulo/estado/
      // contadores pueden haber cambiado y deben verse al volver atras).
      queryClient.setQueryData(adminCursoDetalleKey(curso.id), curso)
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
