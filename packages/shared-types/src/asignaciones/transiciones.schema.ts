/**
 * Schemas Zod de las 5 transiciones de estado del Slice 6 P6b.
 *
 * Cada body se valida con `.strict()` para rechazar claves desconocidas
 * (D-EVI-11). `cerrarCaso` esta discriminado por rol: el service elige el
 * schema segun `asignacion.rol`. Asignados exigen `resultado`; voluntarios
 * lo prohiben (no pueden ser APTO/NO_APTO).
 */

import { z } from "zod"

export const cerrarCasoAsignadoSchema = z
  .object({
    resultado: z.enum(["APTO", "NO_APTO"]),
    observacionesAdmin: z.string().trim().max(2000).optional(),
  })
  .strict()
export type CerrarCasoAsignadoRequest = z.infer<typeof cerrarCasoAsignadoSchema>

export const cerrarCasoVoluntarioSchema = z
  .object({
    observacionesAdmin: z.string().trim().max(2000).optional(),
  })
  .strict()
export type CerrarCasoVoluntarioRequest = z.infer<typeof cerrarCasoVoluntarioSchema>

/**
 * Para `reabrir-caso`, `retirar` e `iniciar-progreso` el body debe ser un
 * objeto vacio (la informacion semantica viaja en headers: X-Motivo,
 * Idempotency-Key cuando aplica).
 */
export const reabrirRetirarBodySchema = z.object({}).strict()
export type ReabrirRetirarBody = z.infer<typeof reabrirRetirarBodySchema>

/**
 * Detalle de las condiciones LISTO no cumplidas. Cuando `cumple=false` se
 * devuelve `422 condicionesListoNoCumplidas` con `details.faltantes`.
 * Codigos posibles:
 *  - `PLAN_INCOMPLETO` (cuando S7 este conectado).
 *  - `TRANSVERSAL_PENDIENTE` (cuando S8 este conectado).
 *  - `ENTREVISTA_IA_PENDIENTE` (cuando S9 este conectado).
 */
export interface CondicionesListoFaltante {
  readonly codigo: "PLAN_INCOMPLETO" | "TRANSVERSAL_PENDIENTE" | "ENTREVISTA_IA_PENDIENTE"
  readonly mensaje: string
}
