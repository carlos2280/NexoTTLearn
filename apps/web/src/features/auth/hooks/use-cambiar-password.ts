import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cambiarPassword } from "../api/cambiar-password.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

export function useCambiarPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cambiarPassword,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIO_ACTUAL_KEY }),
  })
}
