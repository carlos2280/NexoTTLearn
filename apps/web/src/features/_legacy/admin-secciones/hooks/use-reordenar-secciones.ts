import type { ObtenerSeccionesAdminResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { reordenarSeccionesAdmin } from "../api/reordenar-secciones-admin.api"
import { ADMIN_SECCIONES_KEY } from "./use-secciones-admin"

interface ReordenarSeccionesVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly ids: readonly string[]
}

interface ReordenarSeccionesContext {
  readonly previousData: ObtenerSeccionesAdminResponse | undefined
}

// Optimistic UI: aplicamos el nuevo orden inmediatamente sobre el cache para
// que el drag termine en su sitio sin parpadeo. En onError revertimos al
// snapshot previo. En onSettled invalidamos para volver a la verdad del back.
// Mismo patron que useReordenarModulos.
export function useReordenarSecciones() {
  const queryClient = useQueryClient()

  return useMutation<
    ObtenerSeccionesAdminResponse,
    Error,
    ReordenarSeccionesVariables,
    ReordenarSeccionesContext
  >({
    mutationFn: ({ cursoId, moduloId, ids }) =>
      reordenarSeccionesAdmin(cursoId, moduloId, { ids: [...ids] }),
    onMutate: async ({ cursoId, moduloId, ids }) => {
      const queryKey = ADMIN_SECCIONES_KEY(cursoId, moduloId)
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData<ObtenerSeccionesAdminResponse>(queryKey)

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

        queryClient.setQueryData<ObtenerSeccionesAdminResponse>(queryKey, {
          ...previousData,
          items: itemsReordenados,
        })
      }

      return { previousData }
    },
    onError: (_error, { cursoId, moduloId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(ADMIN_SECCIONES_KEY(cursoId, moduloId), context.previousData)
      }
    },
    onSettled: (_data, _error, { cursoId, moduloId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SECCIONES_KEY(cursoId, moduloId) })
    },
  })
}
