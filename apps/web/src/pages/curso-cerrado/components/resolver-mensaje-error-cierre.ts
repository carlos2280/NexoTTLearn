import { ApiError } from "@/shared/api/api-error"

export type ToneBannerCierre = "danger" | "warning"

export interface MensajeErrorCierre {
  readonly tone: ToneBannerCierre
  readonly texto: string
}

/**
 * Decide tono y texto del banner de error de la pantalla de cierre, en base
 * al `error` que devuelve `useResumenCierre`.
 *
 * - `null` → no hay error, devuelve `null` para no pintar nada.
 * - `ApiError` 409 con uno de los 3 codes especificos → mensaje warning
 *   contextual.
 * - Cualquier otro error → fallback `danger` generico.
 *
 * Funcion pura y testeable en aislado. El componente `MensajeErrorCierre`
 * solo renderiza el `Banner` con el resultado de esta funcion.
 */
export function resolverMensajeErrorCierre(error: Error | null): MensajeErrorCierre | null {
  if (!error) {
    return null
  }
  if (error instanceof ApiError && error.status === 409) {
    switch (error.code) {
      case "SNAPSHOT_CIERRE_NO_DISPONIBLE":
        return {
          tone: "warning",
          texto:
            "El admin aún no ha generado la fotografía de cierre de este curso. Vuelve en unos minutos.",
        }
      case "SNAPSHOT_CIERRE_FORMATO_NO_SOPORTADO":
        return {
          tone: "warning",
          texto:
            "La fotografía de cierre de este curso tiene un formato antiguo y no se puede mostrar. Avisa a soporte para regenerarla.",
        }
      case "VEREDICTO_CIERRE_NO_DISPONIBLE":
        return {
          tone: "warning",
          texto: "Tu cierre no tiene un veredicto final disponible en la fotografía del curso.",
        }
      default:
        break
    }
  }
  return {
    tone: "danger",
    texto: "No pudimos cargar el cierre del curso. Reintenta en un momento.",
  }
}
