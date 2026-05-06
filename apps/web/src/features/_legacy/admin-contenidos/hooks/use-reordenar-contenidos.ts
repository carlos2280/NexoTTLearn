import { ADMIN_SECCIONES_KEY } from "@/features/admin-secciones/hooks/use-secciones-admin"
import type {
  ObtenerContenidosAdminResponse,
  ObtenerSeccionesAdminResponse,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { reordenarContenidosAdmin } from "../api/reordenar-contenidos-admin.api"

interface ReordenarContenidosVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  // IDs en el nuevo orden deseado (posicion 0 -> orden 1).
  readonly ids: readonly string[]
}

interface ReordenarContenidosContext {
  readonly previousData: ObtenerSeccionesAdminResponse | undefined
}

// Optimistic UI para drag-drop de bloques. Aplicamos el nuevo orden sobre el
// cache de secciones. En onError revertimos al snapshot.
export function useReordenarContenidos() {
  const queryClient = useQueryClient()

  return useMutation<
    ObtenerContenidosAdminResponse,
    Error,
    ReordenarContenidosVariables,
    ReordenarContenidosContext
  >({
    mutationFn: ({ cursoId, moduloId, seccionId, ids }) =>
      reordenarContenidosAdmin(cursoId, moduloId, seccionId, {
        ordenes: ids.map((id, indice) => ({ id, orden: indice + 1 })),
      }),
    onMutate: async ({ cursoId, moduloId, seccionId, ids }) => {
      const queryKey = ADMIN_SECCIONES_KEY(cursoId, moduloId)
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<ObtenerSeccionesAdminResponse>(queryKey)

      if (previousData) {
        queryClient.setQueryData<ObtenerSeccionesAdminResponse>(queryKey, {
          ...previousData,
          items: previousData.items.map((sec) => {
            if (sec.id !== seccionId) {
              return sec
            }
            const porId = new Map(sec.contenidos.map((c) => [c.id, c]))
            const reord = ids
              .map((id, indice) => {
                const c = porId.get(id)
                if (!c) {
                  return undefined
                }
                return { ...c, orden: indice + 1 }
              })
              .filter((c): c is (typeof sec.contenidos)[number] => c !== undefined)
            return { ...sec, contenidos: reord }
          }),
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
