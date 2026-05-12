import { ListarNotificacionesQuery } from "@nexott-learn/shared-types"
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
      readonly motivo: "ex-empleado" | "silenciado" | "usuario-no-encontrado"
    }

/**
 * Input al listado paginado (E1). `query` viene ya validado por Zod en el
 * controller; el service confia en los tipos.
 */
export interface ListarNotificacionesInput {
  readonly usuarioId: string
  readonly query: ListarNotificacionesQuery
}

/** Item resumido del listado inbox (E1). */
export interface NotificacionResumen {
  readonly id: string
  readonly tipoEvento: TipoEventoNotif
  readonly esCritico: boolean
  readonly fechaCreacion: string
  readonly leida: boolean
  readonly fechaLeida: string | null
  readonly archivada: boolean
}

/** Detalle completo (E3). */
export interface NotificacionDetalle {
  readonly id: string
  readonly tipoEvento: TipoEventoNotif
  readonly esCritico: boolean
  readonly payload: Record<string, unknown>
  readonly fechaCreacion: string
  readonly leida: boolean
  readonly fechaLeida: string | null
  readonly archivada: boolean
  readonly canalesEnviados: readonly CanalNotif[]
  readonly errorCorreo: string | null
}

/** Estado de preferencias (E7 / response de E8). */
export interface PreferenciasNotificacion {
  readonly silenciados: readonly TipoEventoNotif[]
  readonly tiposCriticos: readonly TipoEventoNotif[]
}
