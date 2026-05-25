import { useMutation, useQueryClient } from "@tanstack/react-query"
import { habilitarMfa } from "../api/mfa-enable.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

export function useHabilitarMfa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: habilitarMfa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIO_ACTUAL_KEY }),
  })
}
