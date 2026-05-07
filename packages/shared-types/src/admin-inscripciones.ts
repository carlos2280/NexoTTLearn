import { z } from "zod"

// MAESTRO §6.3, §7.1 · DTOs y tipos para listado de inscripciones de un curso
// desde el panel admin (modulo Diagnostico Tab 1 "Invitados"). El alta masiva
// de candidatos (invitar) queda fuera de este iter y dependera del CRUD de
// Usuarios (P2 del MAPA-FRONT-BACK). Aqui solo lectura, baja y reenvio.
//
// Reglas:
// - Mutaciones .strict() (no aplica aqui, no hay body de mutacion).
// - Filtros opcionales para tab 1: por estado de invitacion (sin login / con
//   login) y por completitud de evaluacion inicial.

// ─────────────────────────────────────────────────────────────────
// Enums alineados con Prisma (sincronizar manualmente si cambia el schema)
// ─────────────────────────────────────────────────────────────────

export const tipoInscripcionSchema = z.enum(["SOLICITUD", "LIBRE"])
export type TipoInscripcion = z.infer<typeof tipoInscripcionSchema>

export const estadoInscripcionSchema = z.enum([
  "ACTIVA",
  "COMPLETADA",
  "ABANDONADA",
  "CERRADO_SIN_COMPLETAR",
])
export type EstadoInscripcion = z.infer<typeof estadoInscripcionSchema>

// Estado derivado para el tab "Invitados" — combinacion de presencia de login
// + cobertura de evaluacion inicial. Lo computa el back para que el front no
// arme heuristicas.
export const estadoInvitadoSchema = z.enum([
  "sin-login",
  "con-login-sin-eval",
  "con-login-con-eval",
])
export type EstadoInvitado = z.infer<typeof estadoInvitadoSchema>

// ─────────────────────────────────────────────────────────────────
// Query · listar inscripciones de un curso
// ─────────────────────────────────────────────────────────────────

export const listarInscripcionesCursoQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    estadoInvitado: estadoInvitadoSchema.optional(),
    tieneEvaluacion: z.enum(["si", "no"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict()
export type ListarInscripcionesCursoQuery = z.infer<typeof listarInscripcionesCursoQuerySchema>

// ─────────────────────────────────────────────────────────────────
// Item del listado
// ─────────────────────────────────────────────────────────────────

export const inscripcionDiagnosticoParticipanteSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
  ultimoLoginAt: z.string().nullable(),
})
export type InscripcionDiagnosticoParticipante = z.infer<
  typeof inscripcionDiagnosticoParticipanteSchema
>

export const inscripcionDiagnosticoEvaluacionSchema = z.object({
  areasConDato: z.number().int().min(0),
  areasTotales: z.number().int().min(0),
  completa: z.boolean(),
})
export type InscripcionDiagnosticoEvaluacion = z.infer<
  typeof inscripcionDiagnosticoEvaluacionSchema
>

export const inscripcionDiagnosticoAsignacionSchema = z.object({
  confirmada: z.boolean(),
  modulosCount: z.number().int().min(0),
})

export const inscripcionDiagnosticoItemSchema = z.object({
  inscripcionId: z.string(),
  cursoId: z.string(),
  participante: inscripcionDiagnosticoParticipanteSchema,
  tipo: tipoInscripcionSchema,
  estado: estadoInscripcionSchema,
  estadoInvitado: estadoInvitadoSchema,
  invitadaAt: z.string(),
  evaluacion: inscripcionDiagnosticoEvaluacionSchema,
  asignacion: inscripcionDiagnosticoAsignacionSchema,
})
export type InscripcionDiagnosticoItem = z.infer<typeof inscripcionDiagnosticoItemSchema>

export const inscripcionDiagnosticoListResponseSchema = z.object({
  items: z.array(inscripcionDiagnosticoItemSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})
export type InscripcionDiagnosticoListResponse = z.infer<
  typeof inscripcionDiagnosticoListResponseSchema
>

// ─────────────────────────────────────────────────────────────────
// Acciones individuales (no requieren body)
// ─────────────────────────────────────────────────────────────────

export const inscripcionDeleteAdminResponseSchema = z.object({
  tipo: z.literal("ELIMINADA"),
  id: z.string(),
})
export type InscripcionDeleteAdminResponse = z.infer<typeof inscripcionDeleteAdminResponseSchema>

export const reenviarCredencialesResponseSchema = z.object({
  ok: z.literal(true),
  enviadoA: z.string().email(),
})
export type ReenviarCredencialesResponse = z.infer<typeof reenviarCredencialesResponseSchema>
