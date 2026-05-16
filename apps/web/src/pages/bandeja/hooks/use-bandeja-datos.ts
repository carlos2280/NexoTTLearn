import { useMiBandeja } from "@/features/me/hooks/use-mi-bandeja"
import type { MeBandejaResponse } from "@nexott-learn/shared-types"

interface BandejaDatos {
  readonly cargando: boolean
  readonly error: Error | null
  readonly data: MeBandejaResponse | null
}

/**
 * Wrapper de `useMiBandeja` (D-BANDEJA-1) que normaliza el shape para la
 * pagina. Toda la heuristica de "siguienteAccion" vive en el server; aqui
 * solo proyectamos el estado de la query a los flags que consume el render.
 */
export function useBandejaDatos(): BandejaDatos {
  const { data, isLoading, error } = useMiBandeja()
  return {
    cargando: isLoading,
    error: (error as Error | null) ?? null,
    data: data ?? null,
  }
}
