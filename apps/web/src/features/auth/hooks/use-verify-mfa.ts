import type { VerifyMfaResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { verifyMfa } from "../api/verify-mfa.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

interface UseVerifyMfaOptions {
  /**
   * Se invoca antes de actualizar la cache del usuario, para que el caller
   * pueda activar una pantalla de exito sin que la guarda (`if (usuario)`)
   * lo redirija prematuramente.
   */
  readonly onSuccess?: (data: VerifyMfaResponse) => void
}

export function useVerifyMfa(options?: UseVerifyMfaOptions) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyMfa,
    onSuccess: (data) => {
      options?.onSuccess?.(data)
      queryClient.setQueryData(USUARIO_ACTUAL_KEY, data.usuario)
    },
  })
}
