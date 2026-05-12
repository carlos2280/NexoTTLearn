import { CanalNotif, Prisma, TipoEventoNotif } from "@prisma/client"

/**
 * Input al orquestador `NotificacionesService.crear()` (D-S10-B6).
 *
 * Cada trigger en P10c construye este input. El `usuarioId` viene del
 * dominio (`asignacion.colaborador.usuarioId`, etc.) y `payload` debe
 * cumplir el shape definido en `payload/<tipo>.payload.ts`.
 *
 * `esCritico` no se pasa: se deriva en `crear()` a partir de `TIPOS_CRITICOS`,
 * lo que garantiza una unica fuente de verdad (R-S10-7).
 */
export interface CrearNotificacionInput {
  readonly usuarioId: string
  readonly tipo: TipoEventoNotif
  readonly payload: Prisma.InputJsonObject
}

/** Resultado del `crear()`. Devuelve null cuando se hizo no-op (EX_EMPLEADO, silenciado). */
export type CrearNotificacionResultado =
  | {
      readonly creada: true
      readonly notificacionId: string
      readonly canalesEnviados: readonly CanalNotif[]
    }
  | {
      readonly creada: false
      readonly motivo: "ex-empleado" | "silenciado"
    }
