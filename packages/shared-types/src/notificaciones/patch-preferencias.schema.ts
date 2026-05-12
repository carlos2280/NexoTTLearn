import { z } from "zod"
import { TIPOS_EVENTO_NOTIF, type TipoEventoNotif } from "./tipo-evento"

const tipoEventoLiteral = z.enum(
  TIPOS_EVENTO_NOTIF as unknown as readonly [TipoEventoNotif, ...TipoEventoNotif[]],
)

/**
 * Schema de body para `PATCH /api/v1/notificaciones/preferencias`.
 *
 * Operacion idempotente: aplicar el mismo body dos veces produce el mismo
 * estado. Listas vacias son validas (no-op para esa lista). Validaciones de
 * negocio extra que el schema NO cubre y se aplican en el service:
 *  - 422 `validacionTipoCriticoNoSilenciable` si `silenciar` contiene un tipo
 *    critico (§19.3 punto 1).
 *  - 422 `validacionTipoEnSilenciarYDesilenciar` si el mismo tipo aparece en
 *    ambas listas (contradiccion del caller).
 */
export const patchPreferenciasNotificacionSchema = z.object({
  silenciar: z.array(tipoEventoLiteral).default([]),
  desilenciar: z.array(tipoEventoLiteral).default([]),
})

export type PatchPreferenciasNotificacionInput = z.infer<typeof patchPreferenciasNotificacionSchema>
