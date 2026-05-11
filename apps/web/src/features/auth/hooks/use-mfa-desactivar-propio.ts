import { useMutation, useQueryClient } from "@tanstack/react-query"
import { desactivarMfaPropio } from "../api/mfa-disable-propio.api"
import { USUARIO_ACTUAL_KEY } from "./use-usuario-actual"

interface Args {
  readonly codigo: string
  readonly motivo: string
}

export function useDesactivarMfaPropio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ codigo, motivo }: Args) => desactivarMfaPropio(codigo, motivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USUARIO_ACTUAL_KEY }),
  })
}
