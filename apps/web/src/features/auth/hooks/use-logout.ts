import { useMutation, useQueryClient } from "@tanstack/react-query"
import { logout } from "../api/logout.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(USUARIO_ACTUAL_KEY, null)
      queryClient.clear()
    },
  })
}
