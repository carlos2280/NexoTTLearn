import { useQuery } from "@tanstack/react-query"
import { obtenerMiFicha } from "../api/obtener-mi-ficha.api"

export const MI_FICHA_KEY = ["me", "ficha"] as const

export function useMiFicha() {
  return useQuery({
    queryKey: MI_FICHA_KEY,
    queryFn: obtenerMiFicha,
    staleTime: 60_000,
  })
}
