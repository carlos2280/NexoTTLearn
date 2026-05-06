import { ADMIN_SECCIONES_KEY } from "@/features/admin-secciones/hooks/use-secciones-admin"
import type {
  ActualizarContenidoInput,
  ContenidoAdminItem,
  ObtenerSeccionesAdminResponse,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarContenidoAdmin } from "../api/actualizar-contenido-admin.api"

interface ActualizarContenidoVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly input: ActualizarContenidoInput
}

interface ActualizarContenidoContext {
  readonly previousData: ObtenerSeccionesAdminResponse | undefined
}

// Optimistic UI para edicion inline (titulo). Aplicamos el cambio sobre el
// cache de secciones (los contenidos viven embebidos como cabeceras dentro
// de cada SeccionAdminItem.contenidos). En onError revertimos.
export function useActualizarContenido() {
  const queryClient = useQueryClient()

  return useMutation<
    ContenidoAdminItem,
    Error,
    ActualizarContenidoVariables,
    ActualizarContenidoContext
  >({
    mutationFn: ({ cursoId, moduloId, seccionId, contenidoId, input }) =>
      actualizarContenidoAdmin(cursoId, moduloId, seccionId, contenidoId, input),
    onMutate: async ({ cursoId, moduloId, seccionId, contenidoId, input }) => {
      const queryKey = ADMIN_SECCIONES_KEY(cursoId, moduloId)
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<ObtenerSeccionesAdminResponse>(queryKey)

      if (previousData) {
        queryClient.setQueryData<ObtenerSeccionesAdminResponse>(queryKey, {
          ...previousData,
          items: previousData.items.map((sec) =>
            sec.id === seccionId
              ? {
                  ...sec,
                  contenidos: sec.contenidos.map((cont) =>
                    cont.id === contenidoId
                      ? { ...cont, titulo: input.titulo ?? cont.titulo }
                      : cont,
                  ),
                }
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
    onSettled: (_data, _error, { cursoId, moduloId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SECCIONES_KEY(cursoId, moduloId) })
    },
  })
}
