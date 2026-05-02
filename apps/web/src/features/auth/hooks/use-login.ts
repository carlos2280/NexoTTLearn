import { useMutation, useQueryClient } from "@tanstack/react-query"
import { login } from "../api/login.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Solo cuando NO hay MFA, ya hay sesion creada y podemos hidratar el cache.
      // En mfa-verify/mfa-setup la sesion se crea tras verify/confirm.
      if (data.status === "ok") {
        queryClient.setQueryData(USUARIO_ACTUAL_KEY, data.usuario)
      }
    },
  })
}
