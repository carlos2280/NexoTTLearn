import { z } from "zod"
import { rolUsuarioSchema } from "./perfil.schema"

/** Tope de filas por tanda: evita requests gigantes (cada alta paga un bcrypt). */
export const MAX_COLABORADORES_LOTE = 200

/**
 * POST /api/v1/colaboradores/lote — alta masiva de colaboradores.
 *
 * Entrada: una lista de `{ email, nombre }` (el nombre es obligatorio, igual que
 * en el alta individual) + un `rol` unico para toda la tanda. La password la
 * autogenera el backend (nunca viaja de entrada). La validacion de dominio
 * permitido vive en el service (es config de la app, no del contrato).
 */
export const crearColaboradoresLoteSchema = z
  .object({
    rol: rolUsuarioSchema,
    habilitarMfa: z.boolean().default(false),
    colaboradores: z
      .array(
        z
          .object({
            email: z.string().trim().email().max(254),
            nombre: z.string().trim().min(1).max(200),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_COLABORADORES_LOTE),
  })
  .strict()

export type CrearColaboradoresLoteInput = z.infer<typeof crearColaboradoresLoteSchema>

/** Por que se rechazo una fila (no se creo su cuenta). */
export type MotivoRechazoLote =
  | "dominio_no_permitido"
  | "duplicado_en_lote"
  | "ya_existe"
  | "error_interno"

export interface ColaboradorLoteCreado {
  readonly email: string
  readonly nombre: string
  /** Password temporal en claro — solo viaja en esta respuesta, no se persiste. */
  readonly passwordTemporal: string
}

export interface ColaboradorLoteRechazado {
  readonly email: string
  readonly nombre: string
  readonly motivo: MotivoRechazoLote
}

/**
 * Respuesta del alta masiva. `creados` trae las passwords en claro (se muestran
 * UNA vez al admin para que las entregue); `rechazados` explica cada fila que no
 * se creo. Todos los creados nacen con `requiereCambioPassword=true`.
 */
export interface AltaColaboradoresLoteResponse {
  readonly creados: readonly ColaboradorLoteCreado[]
  readonly rechazados: readonly ColaboradorLoteRechazado[]
  readonly resumen: {
    readonly total: number
    readonly creados: number
    readonly rechazados: number
  }
  readonly requiereCambioPassword: true
  /** ISO. Fecha de caducidad de la password inicial (misma para toda la tanda). */
  readonly passwordInicialCaducaEn: string
}
