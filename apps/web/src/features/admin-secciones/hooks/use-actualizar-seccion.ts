import type { ActualizarSeccionInput, SeccionAdminItem } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarSeccionAdmin } from "../api/actualizar-seccion-admin.api"
import { ADMIN_SECCIONES_KEY } from "./use-secciones-admin"

interface ActualizarSeccionVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly input: ActualizarSeccionInput
}

// Actualiza metadata de la seccion (titulo). NO se hace optimistic UI: el form
// del drawer muestra loading en el boton de guardar y cierra al exito. Si se
// agregan campos editables que viajen mal por la red (largos), reevaluar.
export function useActualizarSeccion() {
  const queryClient = useQueryClient()

  return useMutation<SeccionAdminItem, Error, ActualizarSeccionVariables>({
    mutationFn: ({ cursoId, moduloId, seccionId, input }) =>
      actualizarSeccionAdmin(cursoId, moduloId, seccionId, input),
    onSuccess: (_seccion, { cursoId, moduloId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SECCIONES_KEY(cursoId, moduloId) })
    },
  })
}
