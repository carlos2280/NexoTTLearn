import { z } from "zod"
import { tipoBloqueSchema } from "./listar-bloques.schema"

/**
 * Tipos de edicion de bloque (D-CAT-14, §5.6 del modelo conceptual).
 *  - COSMETICO: solo `contenido`. No incrementa `version`. No invalida intentos.
 *  - CAMBIA_EVALUACION: actualiza `contenido` + opcionalmente `esEvaluable`
 *    y/o `skillQueMideId`. Incrementa `version`. Invalida intentos previos.
 */
export const tipoEdicionBloqueSchema = z.enum(["COSMETICO", "CAMBIA_EVALUACION"])
export type TipoEdicionBloque = z.infer<typeof tipoEdicionBloqueSchema>

/**
 * Creacion de bloque (POST /api/v1/catalogo/secciones/:seccionId/bloques).
 * Invariante (modelo fisico §3.9): `esEvaluable=true` <=> `skillQueMideId` no
 * null. El service ademas valida que la skill existe + esta ACTIVA si viene.
 */
export const crearBloqueSchema = z
  .object({
    tipo: tipoBloqueSchema,
    esEvaluable: z.boolean(),
    skillQueMideId: z.string().uuid().nullable().optional(),
    contenido: z.record(z.unknown()),
    orden: z.number().int().min(1).max(10_000).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.esEvaluable
        ? typeof v.skillQueMideId === "string"
        : v.skillQueMideId === undefined || v.skillQueMideId === null,
    {
      message: "esEvaluable=true exige skillQueMideId; esEvaluable=false lo prohibe.",
      path: ["skillQueMideId"],
    },
  )

export type CrearBloqueInput = z.infer<typeof crearBloqueSchema>

/**
 * Patch discriminado (PATCH /api/v1/catalogo/bloques/:bloqueId) — D-CAT-14.
 * En modo CAMBIA_EVALUACION, si se incluye `esEvaluable`/`skillQueMideId` se
 * verifica el mismo invariante que en creacion. El motivo se exige a nivel de
 * service (no via @RequiereMotivo): COSMETICO no exige motivo.
 */
export const patchBloqueSchema = z.discriminatedUnion("tipoEdicion", [
  z
    .object({
      tipoEdicion: z.literal("COSMETICO"),
      contenido: z.record(z.unknown()),
    })
    .strict(),
  z
    .object({
      tipoEdicion: z.literal("CAMBIA_EVALUACION"),
      contenido: z.record(z.unknown()),
      esEvaluable: z.boolean().optional(),
      skillQueMideId: z.string().uuid().nullable().optional(),
    })
    .strict(),
])

export type PatchBloqueInput = z.infer<typeof patchBloqueSchema>

/**
 * Reordenar bloques (POST /api/v1/catalogo/secciones/:seccionId/bloques/orden).
 * Mismo patron que secciones: permutacion contigua [1..N].
 */
export const reordenarBloquesSchema = z
  .object({
    orden: z
      .array(
        z
          .object({
            bloqueId: z.string().uuid(),
            orden: z.number().int().min(1).max(10_000),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict()
  .refine(
    (v) => {
      const ids = new Set(v.orden.map((o) => o.bloqueId))
      return ids.size === v.orden.length
    },
    { message: "bloqueId duplicado en la permutacion." },
  )
  .refine(
    (v) => {
      const ordenes = new Set(v.orden.map((o) => o.orden))
      return ordenes.size === v.orden.length
    },
    { message: "orden duplicado en la permutacion." },
  )
  .refine(
    (v) => {
      const ordenes = v.orden.map((o) => o.orden).sort((a, b) => a - b)
      return ordenes.every((o, idx) => o === idx + 1)
    },
    { message: "orden debe ser una permutacion contigua [1..N]." },
  )

export type ReordenarBloquesInput = z.infer<typeof reordenarBloquesSchema>

/**
 * Respuesta de DELETE /api/v1/catalogo/bloques/:bloqueId (soft) — D-CAT-14.
 * `colaboradoresAfectados` queda vacio en P3c; P7 lo poblara cuando
 * `intentos_bloque` tenga datos.
 */
export interface ColaboradorAfectadoBloque {
  readonly colaboradorId: string
  readonly cursoId: string
}

export interface PreviewImpactoEliminarBloque {
  readonly colaboradoresAfectados: readonly ColaboradorAfectadoBloque[]
}
