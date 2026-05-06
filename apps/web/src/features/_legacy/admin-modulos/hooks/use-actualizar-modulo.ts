import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import type { ActualizarModuloInput, ModuloAdminItem } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarModuloAdmin } from "../api/actualizar-modulo-admin.api"
import { ADMIN_MODULOS_KEY } from "./use-modulos-admin"

interface ActualizarModuloVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly input: ActualizarModuloInput
}

export function useActualizarModulo() {
  const queryClient = useQueryClient()

  return useMutation<ModuloAdminItem, Error, ActualizarModuloVariables>({
    mutationFn: ({ cursoId, moduloId, input }) => actualizarModuloAdmin(cursoId, moduloId, input),
    onSuccess: (_modulo, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoId) })
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoId) })
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
