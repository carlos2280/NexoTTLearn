import type { ApiError } from "@/shared/api/api-error"
import type { MeBandejaResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { obtenerMiBandeja } from "../api/obtener-mi-bandeja.api"

export const MI_BANDEJA_KEY = ["me", "bandeja"] as const

/**
 * Query unificada de la home del participante (D-BANDEJA-1). Reemplaza la
 * composicion de `useMisCursos` + `useNotificacionesNoLeidas` +
 * `useCursosDisponiblesVoluntario` del PR2: el server prioriza la accion y
 * envia pendientes + novedades + contadores en un solo round-trip.
 *
 * `staleTime` de 30s: la home se carga al volver de cualquier subseccion;
 * mientras no ha pasado el TTL Tanstack devuelve cache y se evita una query
 * extra al backend.
 */
export function useMiBandeja(): UseQueryResult<MeBandejaResponse, ApiError> {
  return useQuery<MeBandejaResponse, ApiError>({
    queryKey: MI_BANDEJA_KEY,
    queryFn: obtenerMiBandeja,
    staleTime: 30_000,
  })
}
