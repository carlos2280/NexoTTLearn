import { z } from "zod"

/**
 * Schema de creacion de skill (POST /api/v1/catalogo/skills).
 * El wizard D-CAT-15 puede devolver candidatas; con header
 * `X-Forzar-Creacion: true` el cliente decide ignorarlas.
 */
export const crearSkillSchema = z
  .object({
    etiquetaVisible: z.string().trim().min(1).max(200),
    areaId: z.string().uuid(),
  })
  .strict()

export type CrearSkillInput = z.infer<typeof crearSkillSchema>

/**
 * Schema de rename (PATCH /api/v1/catalogo/skills/:id).
 * Solo se acepta `etiquetaVisible`. `areaId` (P3b) y `estado` (endpoints
 * /archivar y /desarchivar) son rechazados por `.strict()`.
 */
export const renombrarSkillSchema = z
  .object({
    etiquetaVisible: z.string().trim().min(1).max(200),
  })
  .strict()

export type RenombrarSkillInput = z.infer<typeof renombrarSkillSchema>

/**
 * Candidata devuelta por el wizard de duplicados (D-CAT-15).
 * `cursosQueLaUsan` agrega las skills exigidas directamente y las
 * indirectas via area exigida; conteo por curso unico (no colaboradores).
 */
export const skillDuplicadaCandidataSchema = z
  .object({
    id: z.string().uuid(),
    etiquetaVisible: z.string(),
    areaNombre: z.string(),
    cursosQueLaUsan: z.number().int().nonnegative(),
  })
  .strict()

export type SkillDuplicadaCandidata = z.infer<typeof skillDuplicadaCandidataSchema>
