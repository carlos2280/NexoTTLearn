/**
 * Plan de estudio personal — snapshot de ficha capturado al momento del
 * calculo o recalculo del plan (D-S7-B3, conceptual §9.8 / D95).
 *
 * `versionSnapshot` permite evolucionar el formato sin romper snapshots
 * antiguos. La version 1 incluye la brecha precalculada (`brecha`) para
 * facilitar el diff visual sin recalcular contra `CursoSkillExigida`.
 */
import { z } from "zod"

export const estadoBrechaSnapshotSchema = z.enum(["NO_CUMPLE", "CERCA", "CUMPLE"])
export type EstadoBrechaSnapshot = z.infer<typeof estadoBrechaSnapshotSchema>

export const origenSnapshotSchema = z.enum([
  "ENTREVISTA_INICIAL",
  "BLOQUE",
  "TRANSVERSAL",
  "ENTREVISTA_IA",
  "MANUAL",
  "SIN_NOTA",
])
export type OrigenSnapshot = z.infer<typeof origenSnapshotSchema>

export const skillSnapshotItemSchema = z
  .object({
    skillId: z.string().uuid(),
    nota: z.number().nullable(),
    origen: origenSnapshotSchema,
    notaMinimaExigida: z.number(),
    brecha: z.number(),
    estado: estadoBrechaSnapshotSchema,
  })
  .strict()
export type SkillSnapshotItem = z.infer<typeof skillSnapshotItemSchema>

export const fichaSnapshotV1Schema = z
  .object({
    fechaCalculo: z.string().datetime(),
    versionSnapshot: z.literal(1),
    skillsConsideradas: z.array(skillSnapshotItemSchema),
  })
  .strict()
export type FichaSnapshotV1 = z.infer<typeof fichaSnapshotV1Schema>
