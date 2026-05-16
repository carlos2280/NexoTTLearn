import { listarBloquesDeSeccion, obtenerBloque } from "@/features/catalogo/api/bloques.api"
import type { ApiError } from "@/shared/api/api-error"
import type { BloqueDetalleResponse } from "@nexott-learn/shared-types"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"

export const BLOQUES_DE_SECCION_KEY = ["me", "bloques-de-seccion"] as const

/**
 * Carga los bloques de una sección listos para renderizar al participante.
 *
 *  1. `GET /catalogo/secciones/:seccionId/bloques` — lista sin `contenido`.
 *  2. Filtra `estado === 'ACTIVO'` (los `ELIMINADO` no llegan en lectura
 *     normal, pero defensa en profundidad).
 *  3. Para cada bloque activo, `GET /catalogo/bloques/:id` en paralelo para
 *     obtener `contenido`. Tras `Promise.all`, ordena por `orden` ASC.
 *
 * Es N+1 a propósito: ver Sub-capa B §"Optimización backend que ANOTO"
 * — cuando llegue `GET /me/asignaciones/:id/secciones/:id/contenido` esto
 * pasa a una sola query y el hook se mantiene como interfaz.
 *
 * `staleTime` corto: el participante navega entre secciones y reusar la
 * cache durante el flujo ahorra round-trips, pero si el admin edita un
 * bloque queremos recargar al volver a abrir.
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
      const lista = await listarBloquesDeSeccion(seccionId)
      const activos = lista.filter((b) => b.estado === "ACTIVO")
      if (activos.length === 0) {
        return []
      }
      const detalles = await Promise.all(activos.map((b) => obtenerBloque(b.id)))
      return [...detalles].sort((a, b) => a.orden - b.orden)
    },
    enabled: !!seccionId,
    staleTime: 30_000,
  })
}
