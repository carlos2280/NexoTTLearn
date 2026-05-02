import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cambiarPassword } from "../api/cambiar-password.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

interface UseCambiarPasswordOptions {
  /**
   * Se invoca antes de invalidar la query del usuario, para que el caller
   * pueda activar una pantalla de exito sin que la guarda
   * (!usuario.debeCambiarPassword) lo redirija prematuramente.
   */
  readonly onSuccess?: () => void
}

export function useCambiarPassword(options?: UseCambiarPasswordOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cambiarPassword,
    onSuccess: async () => {
      options?.onSuccess?.()
      await queryClient.invalidateQueries({ queryKey: USUARIO_ACTUAL_KEY })
    },
  })
}
