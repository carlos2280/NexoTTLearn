import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type EliminarModuloResponse, eliminarModuloAdmin } from "../api/eliminar-modulo-admin.api"
import { ADMIN_MODULOS_KEY } from "./use-modulos-admin"

interface EliminarModuloVariables {
  readonly cursoId: string
  readonly moduloId: string
}

export function useEliminarModulo() {
  const queryClient = useQueryClient()

  return useMutation<EliminarModuloResponse, Error, EliminarModuloVariables>({
    mutationFn: ({ cursoId, moduloId }) => eliminarModuloAdmin(cursoId, moduloId),
    onSuccess: (_resp, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoId) })
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoId) })
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
