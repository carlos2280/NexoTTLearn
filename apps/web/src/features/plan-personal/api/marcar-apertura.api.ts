import { httpClient } from "@/shared/api/http-client"
import type { AperturaSeccionResponse } from "@nexott-learn/shared-types"

/**
 * `POST /api/v1/asignaciones/:asignacionId/secciones/:seccionId/apertura` —
 * tracking idempotente de "primera apertura" (D94). Segundas llamadas
 * devuelven el mismo registro sin escribir; el server usa la clave
 * `@@id([asignacionId, seccionId])`.
 *
 * Las secciones sin bloques evaluables se consideran completadas la primera
 * vez que se abren (D94 §5.4.bis): este POST es lo que activa esa regla.
 */
export function marcarAperturaSeccion(input: {
  readonly asignacionId: string
  readonly seccionId: string
}): Promise<AperturaSeccionResponse> {
  return httpClient.post<AperturaSeccionResponse>(
    `/asignaciones/${input.asignacionId}/secciones/${input.seccionId}/apertura`,
    {},
  )
}
