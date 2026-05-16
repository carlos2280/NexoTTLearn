import { z } from "zod"

/**
 * Shapes Zod v1 del snapshot que congela el contexto al iniciar una entrevista
 * IA (D-S8-D1 / D89). El snapshot se persiste en `intentos_entrevista_ia.transcripcion_o_log`
 * dentro de la clave `seccionesBaseSnapshot` (decision emergente D-EMERG-P8c-1 — el
 * schema fisico carece de columna JSONB dedicada). Permanece congelado durante
 * toda la entrevista (R-S8-3).
 */

const MAX_RESUMEN_LEN = 500

export const tipoBloqueSnapshotSchema = z.enum([
  "CONTENIDO_TEXTO",
  "CONTENIDO_VIDEO",
  "TIPS",
  "QUIZ",
  "CODIGO_PREGUNTAS",
  "CODIGO_TESTS",
])

export type TipoBloqueSnapshot = z.infer<typeof tipoBloqueSnapshotSchema>

export const snapshotSeccionesBaseV1Schema = z
  .object({
    version: z.literal(1),
    secciones: z.array(
      z
        .object({
          seccionId: z.string().uuid(),
          titulo: z.string(),
          moduloTitulo: z.string(),
          skillsEnsenadas: z.array(
            z
              .object({
                skillId: z.string().uuid(),
                nombre: z.string(),
                areaId: z.string().uuid(),
              })
              .strict(),
          ),
          bloques: z.array(
            z
              .object({
                bloqueId: z.string().uuid(),
                tipo: tipoBloqueSnapshotSchema,
                titulo: z.string(),
                resumen: z.string().max(MAX_RESUMEN_LEN),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
  })
  .strict()

export type SnapshotSeccionesBaseV1 = z.infer<typeof snapshotSeccionesBaseV1Schema>

/**
 * Rubrica vigente congelada al crear el intento — sirve para que la IA pondere
 * cada area al calcular la nota final y para mantener auditoria estable si la
 * rubrica cambia despues. Se persiste junto al snapshot de secciones base.
 */
export const rubricaSnapshotV1Schema = z
  .object({
    version: z.literal(1),
    umbralAprobacion: z.number().min(0).max(100),
    filosofia: z.enum(["PREPARACION", "FILTRO"]),
    profundidad: z.enum(["JUNIOR", "SEMI_SENIOR", "SENIOR"]),
    duracionMinutos: z.number().int().positive(),
    tono: z.enum(["CONVERSACIONAL", "FORMAL"]),
    areas: z
      .array(
        z
          .object({
            areaId: z.string().uuid(),
            peso: z.number().min(0).max(100),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()

export type RubricaSnapshotV1 = z.infer<typeof rubricaSnapshotV1Schema>
