import { z } from "zod"
import { criteriosEvaluacionSchema, revisionIaSchema } from "./capas.schema"

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
    intentosMax: z.number().int().min(1).max(50),
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
    /**
     * Lista "a evaluar" que redactó el admin (D-S8, lista a evaluar). Siempre
     * presente como array; vacío cuando el transversal no declara criterios. El
     * participante la ve antes de entregar; el admin la edita en la config.
     */
    criteriosEvaluacion: criteriosEvaluacionSchema,
  })
  .strict()

export type TransversalResponse = z.infer<typeof transversalResponseSchema>

/**
 * `GET /asignaciones/:asignacionId/transversal/disponibilidad` — D42.
 * `fechaDisponibleDesde` solo se incluye cuando `razon === 'DESDE_FECHA'`.
 *
 * B-6: `motivoBloqueo` es una frase amable lista para mostrar al
 * participante. Siempre `null` cuando `disponible === true`; siempre
 * string no vacio cuando `disponible === false`. El copy lo decide el
 * backend para que cambios futuros (i18n, otros clientes) no requieran
 * tocar cada cliente.
 */
export const disponibilidadTransversalResponseSchema = z
  .object({
    disponible: z.boolean(),
    razon: razonDisponibilidadTransversalSchema,
    fechaDisponibleDesde: z.string().nullable(),
    motivoBloqueo: z.string().nullable(),
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

/**
 * Cupo de intentos del transversal para una asignación (Fase 4b ②). El cupo
 * efectivo = `ProyectoTransversal.intentosMax` + `AsignacionCurso.intentosExtraTransversal`.
 * `intentosUsados` cuenta los intentos NO anulados. Solo admin: alimenta el
 * bloque "Intentos" de la pantalla del intento y es también el shape que
 * devuelve el endpoint "dar +1 intento".
 */
export const cupoIntentosTransversalSchema = z
  .object({
    asignacionId: z.string().uuid(),
    intentosUsados: z.number().int().min(0),
    intentosCupo: z.number().int().min(0),
  })
  .strict()

export type CupoIntentosTransversal = z.infer<typeof cupoIntentosTransversalSchema>

/** Respuesta del endpoint `POST /asignaciones/:id/intentos-transversal/intento-extra`. */
export const darIntentoExtraTransversalResponseSchema = cupoIntentosTransversalSchema

export type DarIntentoExtraTransversalResponse = z.infer<
  typeof darIntentoExtraTransversalResponseSchema
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
    /**
     * Informe estructurado de la "Revisión con IA" (capa cualitativa), extraído
     * de `evaluacionesCapas`. `null` mientras la capa aún no se cargó. Solo
     * admin: alimenta la pantalla de revisión del intento (Fase 4).
     */
    revisionIa: revisionIaSchema.nullable(),
    /**
     * Contexto del intento para que la pantalla admin no tenga que hacer
     * lookups adicionales por colaborador/curso/transversal. Solo admin
     * (visibilidad campo-a-campo; los participantes solo ven los propios).
     */
    colaborador: z
      .object({
        id: z.string().uuid(),
        nombre: z.string(),
        email: z.string(),
      })
      .strict(),
    curso: z
      .object({
        id: z.string().uuid(),
        titulo: z.string(),
      })
      .strict(),
    transversal: z
      .object({
        id: z.string().uuid(),
        descripcion: z.string(),
        umbralAprobacion: z.number().min(0).max(100),
      })
      .strict(),
    /**
     * Cupo de intentos de la asignación (usados / cupo efectivo). `null` cuando
     * no se pudo resolver la asignación (p. ej. el colaborador ya no está
     * asignado al curso). Lo puebla el endpoint de detalle; los mappers de
     * listado/capas lo dejan en `null` (no lo necesitan).
     */
    cupoIntentos: cupoIntentosTransversalSchema.nullable(),
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
