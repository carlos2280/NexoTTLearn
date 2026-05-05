import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import { ADMIN_MODULOS_KEY } from "@/features/admin-modulos/hooks/use-modulos-admin"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  type EliminarSeccionResponse,
  eliminarSeccionAdmin,
} from "../api/eliminar-seccion-admin.api"
import { ADMIN_SECCIONES_KEY } from "./use-secciones-admin"

interface EliminarSeccionVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
}

export function useEliminarSeccion() {
  const queryClient = useQueryClient()

  return useMutation<EliminarSeccionResponse, Error, EliminarSeccionVariables>({
    mutationFn: ({ cursoId, moduloId, seccionId }) =>
      eliminarSeccionAdmin(cursoId, moduloId, seccionId),
    onSuccess: (_resp, { cursoId, moduloId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SECCIONES_KEY(cursoId, moduloId) })
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoId) })
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoId) })
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
