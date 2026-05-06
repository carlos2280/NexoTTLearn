import { adminCursoDetalleKey } from "@/features/admin-cursos/hooks/use-curso-admin"
import { ADMIN_CURSOS_KEY } from "@/features/admin-cursos/hooks/use-cursos-admin"
import type { ObtenerModulosAdminResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { reordenarModulosAdmin } from "../api/reordenar-modulos-admin.api"
import { ADMIN_MODULOS_KEY } from "./use-modulos-admin"

interface ReordenarModulosVariables {
  readonly cursoId: string
  readonly ids: readonly string[]
}

interface ReordenarModulosContext {
  readonly previousData: ObtenerModulosAdminResponse | undefined
}

// Optimistic UI: aplicamos el nuevo orden inmediatamente sobre el cache para
// que el drag termine en su sitio sin parpadeo. En onError revertimos al
// snapshot previo. En onSettled invalidamos para volver a la verdad del back.
export function useReordenarModulos() {
  const queryClient = useQueryClient()

  return useMutation<
    ObtenerModulosAdminResponse,
    Error,
    ReordenarModulosVariables,
    ReordenarModulosContext
  >({
    mutationFn: ({ cursoId, ids }) => reordenarModulosAdmin(cursoId, { ids: [...ids] }),
    onMutate: async ({ cursoId, ids }) => {
      const queryKey = ADMIN_MODULOS_KEY(cursoId)
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData<ObtenerModulosAdminResponse>(queryKey)

      if (previousData) {
        const itemsPorId = new Map(previousData.items.map((item) => [item.id, item]))
        const itemsReordenados = ids
          .map((id, indice) => {
            const item = itemsPorId.get(id)
            if (!item) {
              return undefined
            }
            // Reasignamos `orden` localmente para que la UI muestre el numero
            // nuevo sin esperar el roundtrip al back.
            return { ...item, orden: indice + 1 }
          })
          .filter((item): item is (typeof previousData.items)[number] => item !== undefined)

        queryClient.setQueryData<ObtenerModulosAdminResponse>(queryKey, {
          ...previousData,
          items: itemsReordenados,
        })
      }

      return { previousData }
    },
    onError: (_error, { cursoId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(ADMIN_MODULOS_KEY(cursoId), context.previousData)
      }
    },
    onSettled: (_data, _error, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MODULOS_KEY(cursoId) })
      // El detalle del curso no cambia su _count, pero invalidamos por
      // consistencia barata.
      queryClient.invalidateQueries({ queryKey: adminCursoDetalleKey(cursoId) })
      queryClient.invalidateQueries({ queryKey: ADMIN_CURSOS_KEY })
    },
  })
}
