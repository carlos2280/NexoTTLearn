import { z } from "zod"

/**
 * Shapes de respuesta del dominio entrevista IA (Slice 8 P8c — D89, D-S8-D1..D6).
 */

export const estadoIntentoEntrevistaIaSchema = z.enum(["EN_PROGRESO", "FINALIZADO", "ANULADO"])

export type EstadoIntentoEntrevistaIa = z.infer<typeof estadoIntentoEntrevistaIaSchema>

export const razonDisponibilidadEntrevistaIaSchema = z.enum([
  "DISPONIBLE",
  "PLAN_INCOMPLETO",
  "TRANSVERSAL_NO_APROBADO",
  "FECHA_NO_ALCANZADA",
  "RATE_LIMIT_HORA",
  "INTENTO_EN_CURSO",
  "ENTREVISTA_IA_NO_CONFIGURADA",
])

export type RazonDisponibilidadEntrevistaIa = z.infer<typeof razonDisponibilidadEntrevistaIaSchema>

/**
 * `GET /cursos/:cursoId/entrevista-ia` — D89. Rubrica resumida (sin prompts
 * internos: el admin no escribe lineamientos).
 */
export const entrevistaIaResponseSchema = z
  .object({
    entrevistaIaId: z.string().uuid(),
    cursoId: z.string().uuid(),
    umbralAprobacion: z.number().min(0).max(100),
    filosofia: z.enum(["PREPARACION", "FILTRO"]),
    profundidad: z.enum(["JUNIOR", "SEMI_SENIOR", "SENIOR"]),
    duracionMinutos: z.number().int().positive(),
    tono: z.enum(["CONVERSACIONAL", "FORMAL"]),
    areas: z.array(
      z
        .object({
          areaId: z.string().uuid(),
          peso: z.number().min(0).max(100),
        })
        .strict(),
    ),
  })
  .strict()

export type EntrevistaIaResponse = z.infer<typeof entrevistaIaResponseSchema>

/**
 * `GET /asignaciones/:asignacionId/entrevista-ia/disponibilidad`. La razon
 * agrega contexto operacional (cuantos intentos consumidos en la ultima hora,
 * limite). D42 extendida (D-S8-D3).
 *
 * B-6: `motivoBloqueo` es una frase amable lista para mostrar al
 * participante. Siempre `null` cuando `disponible === true`; siempre
 * string no vacio cuando `disponible === false`. El copy lo decide el
 * backend para que cambios futuros (i18n, otros clientes) no requieran
 * tocar cada cliente.
 */
export const disponibilidadEntrevistaIaResponseSchema = z
  .object({
    disponible: z.boolean(),
    razon: razonDisponibilidadEntrevistaIaSchema,
    intentosUsadosHoy: z.number().int().min(0),
    maxPorHora: z.literal(5),
    motivoBloqueo: z.string().nullable(),
  })
  .strict()

export type DisponibilidadEntrevistaIaResponse = z.infer<
  typeof disponibilidadEntrevistaIaResponseSchema
>

/**
 * Respuesta de `POST .../intentos-entrevista-ia` — incluye la primera pregunta
 * que la IA genera al instante (D-S8-D1).
 */
export const crearIntentoEntrevistaIaResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    primeraPregunta: z.string(),
  })
  .strict()

export type CrearIntentoEntrevistaIaResponse = z.infer<
  typeof crearIntentoEntrevistaIaResponseSchema
>

const notaPorAreaSchema = z
  .object({
    areaId: z.string().uuid(),
    nota: z.number().min(0).max(100),
  })
  .strict()

const turnoSchema = z
  .object({
    rol: z.enum(["ASISTENTE", "COLABORADOR"]),
    mensaje: z.string(),
    timestamp: z.string(),
  })
  .strict()

export type TurnoEntrevistaIa = z.infer<typeof turnoSchema>

/**
 * Detalle base del intento — campos compartidos entre ADMIN y PARTICIPANTE.
 * Los campos sensibles (`motivoAjusteOAnulacion`, `notaAjustadaAdmin`) viven
 * solo en la respuesta admin (visibilidad campo-a-campo).
 */
export const intentoEntrevistaIaBaseSchema = z
  .object({
    intentoId: z.string().uuid(),
    estado: estadoIntentoEntrevistaIaSchema,
    fecha: z.string(),
    transcripcion: z.array(turnoSchema),
    notaGlobal: z.number().min(0).max(100).nullable(),
    aprobado: z.boolean().nullable(),
    anulado: z.boolean(),
    notasPorArea: z.array(notaPorAreaSchema),
  })
  .strict()

export type IntentoEntrevistaIaBase = z.infer<typeof intentoEntrevistaIaBaseSchema>

export const intentoEntrevistaIaParticipanteResponseSchema = intentoEntrevistaIaBaseSchema

export type IntentoEntrevistaIaParticipanteResponse = z.infer<
  typeof intentoEntrevistaIaParticipanteResponseSchema
>

export const intentoEntrevistaIaAdminResponseSchema = intentoEntrevistaIaBaseSchema
  .extend({
    notaAjustadaAdmin: z.number().min(0).max(100).nullable(),
    motivoAjusteOAnulacion: z.string().nullable(),
  })
  .strict()

export type IntentoEntrevistaIaAdminResponse = z.infer<
  typeof intentoEntrevistaIaAdminResponseSchema
>

export const listarIntentosEntrevistaIaQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()

export type ListarIntentosEntrevistaIaQuery = z.infer<typeof listarIntentosEntrevistaIaQuerySchema>

export const finalizarEntrevistaResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    notaGlobal: z.number().min(0).max(100),
    aprobado: z.boolean(),
    notasPorArea: z.array(notaPorAreaSchema),
    skillsActualizadas: z.array(z.string().uuid()),
  })
  .strict()

export type FinalizarEntrevistaResponse = z.infer<typeof finalizarEntrevistaResponseSchema>

export const ajustarEntrevistaResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    notaAjustadaAdmin: z.number().min(0).max(100),
    skillsRecalculadas: z.array(z.string().uuid()),
  })
  .strict()

export type AjustarEntrevistaResponse = z.infer<typeof ajustarEntrevistaResponseSchema>

export const anularEntrevistaResponseSchema = z
  .object({
    intentoId: z.string().uuid(),
    anulado: z.literal(true),
    skillsRecalculadas: z.array(z.string().uuid()),
  })
  .strict()

export type AnularEntrevistaResponse = z.infer<typeof anularEntrevistaResponseSchema>
