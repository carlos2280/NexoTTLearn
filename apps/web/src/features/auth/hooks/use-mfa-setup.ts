import { useMutation } from "@tanstack/react-query"
import { iniciarMfaSetup } from "../api/mfa-setup.api"

export function useIniciarMfaSetup() {
  return useMutation({ mutationFn: iniciarMfaSetup })
}
