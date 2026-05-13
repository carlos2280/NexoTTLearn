import type { DesbloquearInput, RegenerarPasswordInicialInput } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { desbloquearUsuario, regenerarPasswordInicial } from "../api/auth-admin.api"
import { PERSONAS_QUERY_KEY } from "./use-listar-personas"

interface RegenerarArgs {
  readonly input: RegenerarPasswordInicialInput
  readonly motivo: string
}

export function useRegenerarPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: RegenerarArgs) => regenerarPasswordInicial(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PERSONAS_QUERY_KEY }),
  })
}

interface DesbloquearArgs {
  readonly input: DesbloquearInput
  readonly motivo: string
}

export function useDesbloquear() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: DesbloquearArgs) => desbloquearUsuario(args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PERSONAS_QUERY_KEY }),
  })
}
