import { httpClient } from "@/shared/api/http-client"
import type { CrearIntentoBloqueInput, IntentoBloqueResponse } from "@nexott-learn/shared-types"

/**
 * `POST /api/v1/intentos-bloque` — registra un intento con `Idempotency-Key`
 * obligatorio (D-S7-C2, D-S7-D6). El motor decide la nota:
 *   - QUIZ → aritmética sobre `respuestas.preguntas`.
 *   - CODIGO_PREGUNTAS → corre el sandbox y devuelve nota según tests.
 *
 * Si la sección hospeda `CODIGO_TESTS` apuntando al `bloqueId`, el server
 * resuelve los tests internamente; el frontend nunca conoce esa relación.
 */
export function crearIntentoBloque(
  input: CrearIntentoBloqueInput,
  idempotencyKey: string,
): Promise<IntentoBloqueResponse> {
  return httpClient.post<IntentoBloqueResponse>("/intentos-bloque", input, {
    idempotencyKey,
  })
}

/**
 * `GET /api/v1/colaboradores/:colaboradorId/bloques/:bloqueId/mejor-intento`
 * — el mejor intento vigente del colaborador en el bloque. Devuelve `null`
 * si nunca intentó o si todos los intentos están invalidados (D81).
 */
export function obtenerMejorIntentoBloque(input: {
  readonly colaboradorId: string
  readonly bloqueId: string
}): Promise<IntentoBloqueResponse | null> {
  return httpClient.get<IntentoBloqueResponse | null>(
    `/colaboradores/${input.colaboradorId}/bloques/${input.bloqueId}/mejor-intento`,
  )
}
