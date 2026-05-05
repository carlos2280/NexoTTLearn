import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import { ADMIN_MODULOS_KEY } from "@/features/admin-modulos/hooks/use-modulos-admin"
import type { CrearSeccionInput, SeccionAdminItem } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { crearSeccionAdmin } from "../api/crear-seccion-admin.api"
import { ADMIN_SECCIONES_KEY } from "./use-secciones-admin"

interface CrearSeccionVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly input: CrearSeccionInput
}

export function useCrearSeccion() {
  const queryClient = useQueryClient()

  return useMutation<SeccionAdminItem, Error, CrearSeccionVariables>({
    mutationFn: ({ cursoId, moduloId, input }) => crearSeccionAdmin(cursoId, moduloId, input),
    onSuccess: (_seccion, { cursoId, moduloId }) => {
      // Lista de secciones del modulo (afecta la pantalla actual).
      queryClient.invalidateQueries({ queryKey: ADMIN_SECCIONES_KEY(cursoId, moduloId) })
      // Lista de modulos del curso (sectionsCount/contentsCount cambia).
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoId) })
      // Detalle del curso (counts derivados).
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoId) })
      // Lista de cursos (counts derivados).
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
