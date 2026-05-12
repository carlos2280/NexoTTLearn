import { z } from "zod"

/**
 * Shapes de respuesta del dominio transversal (Slice 8 P8a — D-S8-C3, D86).
 */

export const estadoIntentoTransversalSchema = z.enum([
  "EN_EVALUACION",
  "EVALUADO",
  "FINALIZADO",
  "ANULADO",
])

export type EstadoIntentoTransversal = z.infer<typeof estadoIntentoTransversalSchema>

export const razonDisponibilidadTransversalSchema = z.enum([
  "PLAN_COMPLETADO",
  "DESDE_FECHA",
  "SIEMPRE",
  "BLOQUEADO_PLAN_INCOMPLETO",
])

export type RazonDisponibilidadTransversal = z.infer<typeof razonDisponibilidadTransversalSchema>

/**
 * `GET /api/v1/cursos/:cursoId/transversal` — D86. Para PARTICIPANTE el campo
 * `pesosCapas` y los flags `capasActivas` se exponen igual (no son secretos
 * de evaluacion), pero la respuesta NO incluye notas internas de intentos.
 */
export const transversalResponseSchema = z
  .object({
    transversalId: z.string().uuid(),
    cursoId: z.string().uuid(),
    descripcion: z.string(),
    umbralAprobacion: z.number().min(0).max(100),
    pesosCapas: z
      .object({
        tests: z.number().min(0).max(100),
        cualitativa: z.number().min(0).max(100),
        comprension: z.number().min(0).max(100),
      })
      .strict(),
    capasActivas: z
      .object({
        tests: z.boolean(),
        cualitativa: z.boolean(),
        comprension: z.boolean(),
      })
      .strict(),
    skillsQueMide: z.array(
      z
        .object({
          skillId: z.string().uuid(),
          nombre: z.string(),
          areaId: z.string().uuid(),
        })
        .strict(),
    ),
  })
  .strict()

export type TransversalResponse = z.infer<typeof transversalResponseSchema>

/**
 * `GET /asignaciones/:asignacionId/transversal/disponibilidad` — D42.
 * `fechaDisponibleDesde` solo se incluye cuando `razon === 'DESDE_FECHA'`.
 */
export const disponibilidadTransversalResponseSchema = z
  .object({
    disponible: z.boolean(),
    razon: razonDisponibilidadTransversalSchema,
    fechaDisponibleDesde: z.string().nullable(),
  })
  .strict()

export type DisponibilidadTransversalResponse = z.infer<
  typeof disponibilidadTransversalResponseSchema
>

/**
 * Respuesta del POST intento transversal (D-S8-C3). Solo expone `intentoId`,
 * `estado` y un ETA aproximado de evaluacion (`fecha + 2s` en P8a / mock).
 */
export const crearIntentoTransversalResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    estado: estadoIntentoTransversalSchema,
    evaluacionAsincronaEsperada: z.string(),
  })
  .strict()

export type CrearIntentoTransversalResponse = z.infer<typeof crearIntentoTransversalResponseSchema>

/**
 * Detalle de un intento transversal (GET /intentos-transversal/:id). ADMIN ve
 * todas las notas y `detalleCapas`; PARTICIPANTE solo lo basico hasta que
 * `estado === 'FINALIZADO'`, momento en el que se le suma `notaGlobal` y
 * `aprobado`. NUNCA recibe `detalleCapas` (D-S8-C2 / D-S8-C3).
 */
export const repoOArtefactoSchema = z
  .object({
    tipo: z.literal("URL_GIT"),
    url: z.string().url(),
  })
  .strict()

export type RepoOArtefacto = z.infer<typeof repoOArtefactoSchema>

export const intentoTransversalBaseSchema = z
  .object({
    intentoId: z.string().uuid(),
    estado: estadoIntentoTransversalSchema,
    fecha: z.string(),
    repoOArtefacto: repoOArtefactoSchema,
    comentarioColaborador: z.string().nullable(),
  })
  .strict()

export type IntentoTransversalBase = z.infer<typeof intentoTransversalBaseSchema>

export const intentoTransversalParticipanteResponseSchema = intentoTransversalBaseSchema
  .extend({
    notaGlobal: z.number().min(0).max(100).nullable(),
    aprobado: z.boolean().nullable(),
  })
  .strict()

export type IntentoTransversalParticipanteResponse = z.infer<
  typeof intentoTransversalParticipanteResponseSchema
>

export const intentoTransversalAdminResponseSchema = intentoTransversalBaseSchema
  .extend({
    notaCapaTests: z.number().min(0).max(100).nullable(),
    notaCapaCualitativa: z.number().min(0).max(100).nullable(),
    notaCapaComprension: z.number().min(0).max(100).nullable(),
    notaGlobal: z.number().min(0).max(100).nullable(),
    aprobado: z.boolean().nullable(),
    anulado: z.boolean(),
    motivoAnulacion: z.string().nullable(),
  })
  .strict()

export type IntentoTransversalAdminResponse = z.infer<typeof intentoTransversalAdminResponseSchema>

export const listarIntentosTransversalQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    estado: estadoIntentoTransversalSchema.optional(),
  })
  .strict()

export type ListarIntentosTransversalQuery = z.infer<typeof listarIntentosTransversalQuerySchema>
