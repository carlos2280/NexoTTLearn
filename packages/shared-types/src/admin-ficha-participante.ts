// Iter 10 · MAESTRO §13.6, A30 · ficha 360° del participante.
// Read-only, los CTAs son IDs literales — el front decide cómo renderizar.

import { z } from "zod"

// ─────────────────────────────────────────────────────────────────
// CTAs disponibles según estado (front decide visibilidad).
// ─────────────────────────────────────────────────────────────────

export const fichaCtaSchema = z.enum([
  "AJUSTAR_NOTA",
  "REASIGNAR_MODULO",
  "DESINSCRIBIR",
  "AJUSTAR_EXPEDIENTE",
  "RESET_PASSWORD",
  "BLOQUEAR",
  "DESBLOQUEAR",
  "ACTIVAR_MFA",
  "RESET_MFA",
])
export type FichaCta = z.infer<typeof fichaCtaSchema>

// ─────────────────────────────────────────────────────────────────
// Sub-schemas de la ficha
// ─────────────────────────────────────────────────────────────────

export const fichaDatosPersonalesSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
  rol: z.enum(["ADMIN", "PARTICIPANTE", "VIEWER", "SUPER_ADMIN"]),
  estado: z.enum(["activo", "bloqueado"]),
  mfaActivo: z.boolean(),
})
export type FichaDatosPersonales = z.infer<typeof fichaDatosPersonalesSchema>

export const fichaExpedienteAreaSchema = z.object({
  areaId: z.string().uuid(),
  nombre: z.string(),
  nota: z.number(),
})
export type FichaExpedienteArea = z.infer<typeof fichaExpedienteAreaSchema>

export const fichaExpedienteEntrySchema = z.object({
  cursoId: z.string().uuid(),
  titulo: z.string(),
  empresaCliente: z.string(),
  fechaCierre: z.string(),
  notaGlobal: z.number(),
  etiqueta: z.enum(["EXCELENCIA", "APROBADO", "EN_DESARROLLO", "INSUFICIENTE"]),
  notasArea: z.array(fichaExpedienteAreaSchema),
})
export type FichaExpedienteEntry = z.infer<typeof fichaExpedienteEntrySchema>

export const fichaCursoActivoSchema = z.object({
  cursoId: z.string().uuid(),
  titulo: z.string(),
  empresaCliente: z.string(),
  estadoSeguimiento: z.enum(["Apto", "EnRuta", "EnRiesgo", "Completado"]),
  modulosAsignados: z.number().int(),
  pctAvance: z.number(),
  notaProyectada: z.number().nullable(),
})
export type FichaCursoActivo = z.infer<typeof fichaCursoActivoSchema>

export const fichaCursoCerradoSchema = z.object({
  cursoId: z.string().uuid(),
  titulo: z.string(),
  empresaCliente: z.string(),
  estado: z.enum(["ABANDONADA", "CERRADO_SIN_COMPLETAR"]),
  fecha: z.string().nullable(),
})
export type FichaCursoCerrado = z.infer<typeof fichaCursoCerradoSchema>

export const fichaEstadisticaAreaSchema = z.object({
  areaId: z.string().uuid(),
  nombre: z.string(),
  mejorNota: z.number(),
  peorNota: z.number(),
  cursosTocados: z.number().int(),
  fechaUltima: z.string(),
})
export type FichaEstadisticaArea = z.infer<typeof fichaEstadisticaAreaSchema>

export const fichaHistorialEntregaSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(["BLOQUE", "PROYECTO"]),
  inscripcionId: z.string().uuid(),
  cursoId: z.string().uuid(),
  cursoTitulo: z.string(),
  nota: z.number().nullable(),
  estado: z.string(),
  enviadaAt: z.string(),
  evaluadaAt: z.string().nullable(),
})
export type FichaHistorialEntrega = z.infer<typeof fichaHistorialEntregaSchema>

export const fichaEntrevistaIASchema = z.object({
  id: z.string().uuid(),
  cursoId: z.string().uuid(),
  cursoTitulo: z.string(),
  intento: z.number().int(),
  estado: z.enum(["PENDIENTE", "EN_CURSO", "APROBADA", "NO_APROBADA", "AJUSTADA_MANUAL"]),
  scoreGeneral: z.number().nullable(),
  finalizadaAt: z.string().nullable(),
})
export type FichaEntrevistaIA = z.infer<typeof fichaEntrevistaIASchema>

// ─────────────────────────────────────────────────────────────────
// Response E4
// ─────────────────────────────────────────────────────────────────

export const fichaParticipanteResponseSchema = z.object({
  datosPersonales: fichaDatosPersonalesSchema,
  expediente: z.array(fichaExpedienteEntrySchema),
  cursosActivos: z.array(fichaCursoActivoSchema),
  cursosCerrados: z.array(fichaCursoCerradoSchema),
  estadisticaPorArea: z.array(fichaEstadisticaAreaSchema),
  historialEntregas: z.array(fichaHistorialEntregaSchema),
  historialEntrevistasIA: z.array(fichaEntrevistaIASchema),
  ctas: z.array(fichaCtaSchema),
})
export type FichaParticipanteResponse = z.infer<typeof fichaParticipanteResponseSchema>
