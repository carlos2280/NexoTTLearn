import type { ActualizarPesosCursoInput, CursoAdminDetalle } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarPesosCurso } from "../api/actualizar-pesos-curso.api"
import { adminCursoDetalleKey } from "./use-curso-admin"

interface ActualizarPesosVariables {
  readonly id: string
  readonly input: ActualizarPesosCursoInput
}

export function useActualizarPesosCurso() {
  const queryClient = useQueryClient()

  return useMutation<CursoAdminDetalle, Error, ActualizarPesosVariables>({
    mutationFn: ({ id, input }) => actualizarPesosCurso(id, input),
    onSuccess: (curso) => {
      // El back upserta el nivel enviado y borra el resto del MISMO nivel.
      // Reemplazamos el detalle cacheado con la respuesta canonica para que
      // los demas tabs vean el `tipoPesos` actualizado sin refetch.
      queryClient.setQueryData(adminCursoDetalleKey(curso.id), curso)
    },
  })
}
