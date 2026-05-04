import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import type { ClonarModuloInput, ModuloAdminItem } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { clonarModuloAdmin } from "../api/clonar-modulo-admin.api"
import { ADMIN_MODULOS_KEY } from "./use-modulos-admin"

interface ClonarModuloVariables {
  readonly cursoIdDestino: string
  readonly input: ClonarModuloInput
}

export function useClonarModulo() {
  const queryClient = useQueryClient()

  return useMutation<ModuloAdminItem, Error, ClonarModuloVariables>({
    mutationFn: ({ cursoIdDestino, input }) => clonarModuloAdmin(cursoIdDestino, input),
    onSuccess: (_modulo, { cursoIdDestino }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoIdDestino) })
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoIdDestino) })
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
