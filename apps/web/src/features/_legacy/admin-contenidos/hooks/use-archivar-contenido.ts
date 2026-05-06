import { ADMIN_SECCIONES_KEY } from "@/features/admin-secciones/hooks/use-secciones-admin"
import type { ContenidoAdminItem, ObtenerSeccionesAdminResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  archivarContenidoAdmin,
  restaurarContenidoAdmin,
} from "../api/archivar-contenido-admin.api"

interface ToggleArchivarVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
}

interface ToggleContext {
  readonly previousData: ObtenerSeccionesAdminResponse | undefined
}

// Optimistic UI: marcamos el contenido como archivado/restaurado en el cache
// antes del request. En onError revertimos.
function buildToggleHook(modo: "archivar" | "restaurar") {
  return function useToggleArchivar() {
    const queryClient = useQueryClient()
    const archivadoNuevo = modo === "archivar"

    return useMutation<ContenidoAdminItem, Error, ToggleArchivarVariables, ToggleContext>({
      mutationFn: ({ cursoId, moduloId, seccionId, contenidoId }) =>
        modo === "archivar"
          ? archivarContenidoAdmin(cursoId, moduloId, seccionId, contenidoId)
          : restaurarContenidoAdmin(cursoId, moduloId, seccionId, contenidoId),
      onMutate: async ({ cursoId, moduloId, seccionId, contenidoId }) => {
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
                    contenidos: sec.contenidos.map((c) =>
                      c.id === contenidoId ? { ...c, archivado: archivadoNuevo } : c,
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
}

export const useArchivarContenido = buildToggleHook("archivar")
export const useRestaurarContenido = buildToggleHook("restaurar")
