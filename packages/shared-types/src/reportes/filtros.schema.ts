import { z } from "zod"

/**
 * Schema centralizado de filtros estandar de reportes (D-S11-B6).
 *
 * Aglutina todos los parametros que comparten los endpoints de reportes
 * (operativos + estrategicos). Cada endpoint deriva su propio sub-schema con
 * `.pick()` para exigir lo que realmente necesita; este schema "padre" valida
 * tipos y rangos sin imponer requeridos.
 *
 * `vista` controla el dispatcher temporal (D-S11-B7): `ACTUAL` lee tablas
 * vivas, `FOTOGRAFIA_CIERRE` lee de `cursos_fotografia_cierre`, `HISTORICO`
 * lee de `historico_estados_asignacion` + `log_cambios_curso`.
 *
 * `cursoIds` acepta lista CSV (`?cursoIds=a,b,c`) — se parsea a array y se
 * valida cada elemento como UUID.
 */

const isoDateSchema = z.coerce.date()
const uuidSchema = z.string().uuid()

const vistaReporteSchema = z.enum(["ACTUAL", "FOTOGRAFIA_CIERRE", "HISTORICO"])

const cursoIdsCsvSchema = z
  .union([z.array(uuidSchema), z.string()])
  .optional()
  .transform((value, ctx): readonly string[] | undefined => {
    if (value === undefined) {
      return undefined
    }
    const tokens = Array.isArray(value)
      ? value
      : value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
    const resultado: string[] = []
    for (const token of tokens) {
      const parsed = uuidSchema.safeParse(token)
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `cursoIds contiene un valor no UUID: ${token}`,
          path: [],
        })
        return z.NEVER
      }
      resultado.push(parsed.data)
    }
    return resultado
  })

export const filtrosEstandarSchema = z
  .object({
    desde: isoDateSchema.optional(),
    hasta: isoDateSchema.optional(),
    clienteId: uuidSchema.optional(),
    cursoId: uuidSchema.optional(),
    cursoIds: cursoIdsCsvSchema,
    areaId: uuidSchema.optional(),
    skillId: uuidSchema.optional(),
    colaboradorId: uuidSchema.optional(),
    estado: z.string().min(1).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().min(1).optional(),
    vista: vistaReporteSchema.default("ACTUAL"),
    format: z.enum(["json"]).default("json"),
  })
  .strict()

export type VistaReporte = z.infer<typeof vistaReporteSchema>
export type FiltrosEstandar = z.infer<typeof filtrosEstandarSchema>

// ---------------------------------------------------------------------------
// Sub-schemas estrictos por endpoint operativo (P11b)
// ---------------------------------------------------------------------------

/**
 * `GET /reportes/avance-curso` — cursoId requerido, vista dispatcher.
 */
export const avanceCursoQuerySchema = z
  .object({
    cursoId: uuidSchema,
    vista: vistaReporteSchema.default("ACTUAL"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().min(1).optional(),
    format: z.enum(["json"]).default("json"),
  })
  .strict()
export type AvanceCursoQuery = z.infer<typeof avanceCursoQuerySchema>

/**
 * `GET /reportes/detalle-colaborador` — cursoId + colaboradorId requeridos,
 * solo ACTUAL en P11b (FOTOGRAFIA_CIERRE / HISTORICO devuelven 422).
 */
export const detalleColaboradorQuerySchema = z
  .object({
    cursoId: uuidSchema,
    colaboradorId: uuidSchema,
    vista: vistaReporteSchema.default("ACTUAL"),
    format: z.enum(["json"]).default("json"),
  })
  .strict()
export type DetalleColaboradorQuery = z.infer<typeof detalleColaboradorQuerySchema>

/**
 * `GET /reportes/brechas-detectadas` — cursoId requerido, ACTUAL only.
 */
export const brechasDetectadasQuerySchema = z
  .object({
    cursoId: uuidSchema,
    vista: vistaReporteSchema.default("ACTUAL"),
    format: z.enum(["json"]).default("json"),
  })
  .strict()
export type BrechasDetectadasQuery = z.infer<typeof brechasDetectadasQuerySchema>

/**
 * `GET /reportes/centro-revision` — cursoId opcional, tipo dispatcher.
 */
export const centroRevisionQuerySchema = z
  .object({
    cursoId: uuidSchema.optional(),
    tipo: z.enum(["TRANSVERSAL", "ENTREVISTA_IA", "TODAS"]).default("TODAS"),
    vista: vistaReporteSchema.default("ACTUAL"),
    format: z.enum(["json"]).default("json"),
  })
  .strict()
export type CentroRevisionQuery = z.infer<typeof centroRevisionQuerySchema>
