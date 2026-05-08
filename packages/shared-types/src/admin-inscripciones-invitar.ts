import { z } from "zod"
import { inscripcionDiagnosticoItemSchema } from "./admin-inscripciones"

// MAESTRO §6.3, §7.1 · Alta masiva de candidatos a un curso por seleccion de
// Usuarios PARTICIPANTE existentes (no bloqueados). El alta de usuarios nuevos
// inline pertenece al CRUD de Usuarios (P2 del MAPA-FRONT-BACK).
//
// Idempotencia: si un participanteId ya tiene inscripcion ACTIVA en el curso,
// se devuelve en `yaInvitados` (no es error). Permite reintento seguro.

// ─────────────────────────────────────────────────────────────────
// Invitar candidatos (POST)
// ─────────────────────────────────────────────────────────────────

export const invitarCandidatosBodySchema = z
  .object({
    participanteIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .strict()
export type InvitarCandidatosBody = z.infer<typeof invitarCandidatosBodySchema>

export const invitarCandidatosErrorCodigoSchema = z.enum([
  "USUARIO_NO_ENCONTRADO",
  "USUARIO_NO_PARTICIPANTE",
  "USUARIO_BLOQUEADO",
])
export type InvitarCandidatosErrorCodigo = z.infer<typeof invitarCandidatosErrorCodigoSchema>

export const invitarCandidatosResponseSchema = z.object({
  creadas: z.array(inscripcionDiagnosticoItemSchema),
  yaInvitados: z.array(
    z.object({
      participanteId: z.string(),
      inscripcionId: z.string(),
    }),
  ),
  errores: z.array(
    z.object({
      participanteId: z.string(),
      codigo: invitarCandidatosErrorCodigoSchema,
    }),
  ),
})
export type InvitarCandidatosResponse = z.infer<typeof invitarCandidatosResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Buscar candidatos disponibles (GET)
// Usuarios PARTICIPANTE no bloqueados, sin inscripcion ACTIVA en el curso.
// ─────────────────────────────────────────────────────────────────

export const candidatosDisponiblesQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict()
export type CandidatosDisponiblesQuery = z.infer<typeof candidatosDisponiblesQuerySchema>

export const candidatoDisponibleSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
})
export type CandidatoDisponible = z.infer<typeof candidatoDisponibleSchema>

export const candidatosDisponiblesResponseSchema = z.object({
  items: z.array(candidatoDisponibleSchema),
  truncado: z.boolean(),
})
export type CandidatosDisponiblesResponse = z.infer<typeof candidatosDisponiblesResponseSchema>
