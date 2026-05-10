import { httpClient } from "@/shared/api/http-client"
import type { AceptarAvisoPrivacidadInput } from "../types"

export function aceptarAvisoPrivacidad(input: AceptarAvisoPrivacidadInput): Promise<void> {
  return httpClient.post<void>("/auth/aceptar-aviso-privacidad", input)
}
