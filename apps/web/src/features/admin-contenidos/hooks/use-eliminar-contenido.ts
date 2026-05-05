import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import { ADMIN_MODULOS_KEY } from "@/features/admin-modulos/hooks/use-modulos-admin"
import { ADMIN_SECCIONES_KEY } from "@/features/admin-secciones/hooks/use-secciones-admin"
import type { ObtenerSeccionesAdminResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { eliminarContenidoAdmin } from "../api/eliminar-contenido-admin.api"

interface EliminarContenidoVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
}

interface EliminarContenidoContext {
  readonly previousData: ObtenerSeccionesAdminResponse | undefined
}

// Optimistic: removemos el item del cache antes del request. En onError
// revertimos. Si el back devuelve 409 (tiene entregas), el toast del
// consumidor sugiere "Archivar" en su lugar.
export function useEliminarContenido() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, EliminarContenidoVariables, EliminarContenidoContext>({
    mutationFn: ({ cursoId, moduloId, seccionId, contenidoId }) =>
      eliminarContenidoAdmin(cursoId, moduloId, seccionId, contenidoId),
    onMutate: async ({ cursoId, moduloId, seccionId, contenidoId }) => {
      const queryKey = ADMIN_SECCIONES_KEY(cursoId, moduloId)
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<ObtenerSeccionesAdminResponse>(queryKey)

      if (previousData) {
        queryClient.setQueryData<ObtenerSeccionesAdminResponse>(queryKey, {
          ...previousData,
          items: previousData.items.map((sec) =>
            sec.id === seccionId
              ? { ...sec, contenidos: sec.contenidos.filter((c) => c.id !== contenidoId) }
              : sec,
          ),
        })
      }

      return { previousData }
    },
    onError: (_error, { cursoId, moduloId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(ADMIN_SECCIONES_KEY(cursoId, moduloId), context.previousData)
      }
    },
    onSuccess: (_void, { cursoId, moduloId }) => {
      // Counts derivados (contentsCount en modulo y curso) cambian.
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoId) })
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoId) })
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_SECCIONES_KEY(cursoId, moduloId) })
    },
  })
}
