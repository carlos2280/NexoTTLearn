import { obtenerContenidoDeSeccion } from "@/features/catalogo/api/bloques.api"
import type { ApiError } from "@/shared/api/api-error"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"

export const BLOQUES_DE_SECCION_KEY = ["me", "bloques-de-seccion"] as const

/**
 * Carga los bloques de una sección listos para renderizar al participante.
 *
 * Usa `GET /catalogo/secciones/:seccionId/contenido` que devuelve todos los
 * bloques ACTIVOS de la sección con su `contenido` incluido, ya ordenados por
 * `orden ASC`, en una sola query. Sustituye al patrón N+1 previo (un GET por
 * bloque) que reventaba el throttler en secciones con muchos bloques.
 *
 * `staleTime` corto: el participante navega entre secciones y reusar la cache
 * durante el flujo ahorra round-trips, pero si el admin edita un bloque
 * queremos recargar al volver a abrir.
 */
export function useBloquesDeSeccion(
  seccionId: string | null | undefined,
): UseQueryResult<readonly BloqueDetalleResponse[], ApiError> {
  return useQuery<readonly BloqueDetalleResponse[], ApiError>({
    queryKey: [...BLOQUES_DE_SECCION_KEY, seccionId ?? null] as const,
    queryFn: async () => {
      if (!seccionId) {
        return []
      }
      return await obtenerContenidoDeSeccion(seccionId)
    },
    enabled: !!seccionId,
    staleTime: 30_000,
  })
}
