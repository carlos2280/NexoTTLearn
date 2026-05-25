import type { IntentoEntrevistaIaParticipanteResponse } from "@nexott-learn/shared-types"
import { useCallback } from "react"
import { obtenerIntentoEntrevistaIa } from "../api/intentos-entrevista-ia.api"

/**
 * Devuelve `continuar(intentoId)`: carga el intento `EN_PROGRESO` por id y
 * entrega el detalle al callback para que el orquestador del chat lo retome
 * donde quedo. Errores silenciados a proposito: la siguiente lectura de
 * disponibilidad refleja cualquier problema de carga.
 */
export function useContinuarIntentoEntrevistaIa(
  onIntentoCargado: (intento: IntentoEntrevistaIaParticipanteResponse) => void,
): (intentoId: string) => void {
  return useCallback(
    (intentoId: string) => {
      obtenerIntentoEntrevistaIa(intentoId)
        .then(onIntentoCargado)
        .catch(() => undefined)
    },
    [onIntentoCargado],
  )
}
