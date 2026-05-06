import type { CrearCursoInput, CursoAdminDetalle } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { crearCursoAdmin } from "../api/crear-curso-admin.api"
import { ADMIN_CURSOS_KEY } from "./use-cursos-admin"

export function useCrearCurso() {
  const queryClient = useQueryClient()

  return useMutation<CursoAdminDetalle, Error, CrearCursoInput>({
    mutationFn: crearCursoAdmin,
    onSuccess: () => {
      // Invalida la lista para que el nuevo curso aparezca al volver a /admin/cursos.
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
