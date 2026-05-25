import { useQuery } from "@tanstack/react-query"
import { obtenerHistorialFicha } from "../api/obtener-historial-ficha.api"

export const HISTORIAL_FICHA_KEY = ["me", "ficha", "historial"] as const

export function useHistorialFicha() {
  return useQuery({
    queryKey: HISTORIAL_FICHA_KEY,
    queryFn: obtenerHistorialFicha,
    staleTime: 60_000,
  })
}
