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

/**
 * P3b — cambio de area de una skill (POST /api/v1/catalogo/skills/:id/area).
 * Tambien se usa para el preview (mismo body, sin escritura).
 */
export const cambiarAreaSkillSchema = z
  .object({
    areaDestinoId: z.string().uuid(),
  })
  .strict()

export type CambiarAreaSkillInput = z.infer<typeof cambiarAreaSkillSchema>

/**
 * P3b — fusion de dos skills (POST /api/v1/catalogo/skills/fusionar).
 * La perdedora queda ARCHIVADA y sus referencias se redirigen a la ganadora.
 * `nota_skill` queda intacta (consolidacion diferida a P7).
 */
export const fusionarSkillsSchema = z
  .object({
    skillGanadoraId: z.string().uuid(),
    skillPerdedoraId: z.string().uuid(),
  })
  .strict()
  .refine((datos) => datos.skillGanadoraId !== datos.skillPerdedoraId, {
    message: "skillGanadoraId y skillPerdedoraId deben ser distintos",
    path: ["skillPerdedoraId"],
  })

export type FusionarSkillsInput = z.infer<typeof fusionarSkillsSchema>

/**
 * Impacto que el preview de cambio de area calcula sin escribir. Los conteos
 * cubren las referencias directas a la skill mas las indirectas via el area
 * actual (cursos exigidos por area completa).
 */
export interface ImpactoCambioAreaSkill {
  readonly cursosAfectados: readonly { readonly cursoId: string; readonly titulo: string }[]
  readonly modulosAfectados: readonly { readonly moduloId: string; readonly titulo: string }[]
  readonly bloquesAfectados: number
  readonly seccionesAfectadas: number
  readonly totalReferencias: number
}

export interface PreviewCambioAreaResponse {
  readonly skillId: string
  readonly areaActualId: string
  readonly areaDestinoId: string
  readonly impacto: ImpactoCambioAreaSkill
}

export interface ReferenciasMigradasFusion {
  readonly secciones: number
  readonly cursos: number
  readonly bloques: number
}
