import type { ConfirmMfaSetupResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { confirmMfaSetup } from "../api/confirm-mfa-setup.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

interface UseConfirmMfaSetupOptions {
  /**
   * Se invoca antes de actualizar la cache del usuario, para que el caller
   * pueda activar una pantalla de exito sin que la guarda (`if (usuario)`)
   * lo redirija prematuramente.
   */
  readonly onSuccess?: (data: ConfirmMfaSetupResponse) => void
}

export function useConfirmMfaSetup(options?: UseConfirmMfaSetupOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmMfaSetup,
    onSuccess: (data) => {
      options?.onSuccess?.(data)
      queryClient.setQueryData(USUARIO_ACTUAL_KEY, data.usuario)
    },
  })
}
