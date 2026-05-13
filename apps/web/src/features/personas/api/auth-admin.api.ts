import { httpClient } from "@/shared/api/http-client"
import type { DesbloquearInput, RegenerarPasswordInicialInput } from "@nexott-learn/shared-types"

export interface RegenerarPasswordResponse {
  readonly modoEntrega: "MANUAL"
  readonly passwordTemporal: string
  readonly caducaEn: string
}

export function regenerarPasswordInicial(args: {
  readonly input: RegenerarPasswordInicialInput
  readonly motivo: string
}): Promise<RegenerarPasswordResponse> {
  return httpClient.post<RegenerarPasswordResponse>(
    "/auth/regenerar-password-inicial",
    args.input,
    { motivo: args.motivo },
  )
}

export function desbloquearUsuario(args: {
  readonly input: DesbloquearInput
  readonly motivo: string
}): Promise<void> {
  return httpClient.post<void>("/auth/desbloquear", args.input, { motivo: args.motivo })
}
