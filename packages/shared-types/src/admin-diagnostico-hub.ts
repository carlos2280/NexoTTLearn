import { z } from "zod"

// MAESTRO §4.2 + 3-pantallas/admin/diagnostico/hub.md · vista cross-cursos del
// modulo Diagnostico. Devuelve cursos en estado ACTIVO con contadores
// operativos (no de progreso) para que el admin priorice por urgencia. NO
// edita, solo dirige al curso correcto.

// ─────────────────────────────────────────────────────────────────
// Tipos compartidos
// ─────────────────────────────────────────────────────────────────

export const estadoDiagnosticoHubSchema = z.enum(["pendiente", "al-dia", "sin-invitados"])
export type EstadoDiagnosticoHub = z.infer<typeof estadoDiagnosticoHubSchema>

// 1 = tab Invitados · 2 = tab Evaluacion · 3 = tab Asignacion. La regla:
//   - invitados = 0                  → 1
//   - sinEvaluacion > 0              → 2
//   - sinAsignacion > 0              → 3
//   - todo capturado                 → 3 (fallback, estado al-dia)
export const tabSugeridoHubSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export type TabSugeridoHub = z.infer<typeof tabSugeridoHubSchema>

export const hubContadoresSchema = z.object({
  invitados: z.number().int().min(0),
  sinEvaluacion: z.number().int().min(0),
  sinAsignacion: z.number().int().min(0),
})
export type HubContadores = z.infer<typeof hubContadoresSchema>

export const hubDiagnosticoItemSchema = z.object({
  cursoId: z.string(),
  empresaCliente: z.string(),
  titulo: z.string(),
  deadline: z.string().nullable(),
  diasRestantes: z.number().int().nullable(),
  contadores: hubContadoresSchema,
  estadoDiagnostico: estadoDiagnosticoHubSchema,
  tabSugerido: tabSugeridoHubSchema,
})
export type HubDiagnosticoItem = z.infer<typeof hubDiagnosticoItemSchema>

// ─────────────────────────────────────────────────────────────────
// GET /admin/diagnostico/hub
// ─────────────────────────────────────────────────────────────────

export const hubDiagnosticoResponseSchema = z.object({
  items: z.array(hubDiagnosticoItemSchema),
  total: z.number().int().min(0),
})
export type HubDiagnosticoResponse = z.infer<typeof hubDiagnosticoResponseSchema>
