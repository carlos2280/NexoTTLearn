import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import type { CrearModuloInput, ModuloAdminItem } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { crearModuloAdmin } from "../api/crear-modulo-admin.api"
import { ADMIN_MODULOS_KEY } from "./use-modulos-admin"

interface CrearModuloVariables {
  readonly cursoId: string
  readonly input: CrearModuloInput
}

export function useCrearModulo() {
  const queryClient = useQueryClient()

  return useMutation<ModuloAdminItem, Error, CrearModuloVariables>({
    mutationFn: ({ cursoId, input }) => crearModuloAdmin(cursoId, input),
    onSuccess: (_modulo, { cursoId }) => {
      // Lista de modulos del curso (afecta el tab actual).
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoId) })
      // Detalle del curso (modules count cambia).
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoId) })
      // Lista de cursos del admin (counts).
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
