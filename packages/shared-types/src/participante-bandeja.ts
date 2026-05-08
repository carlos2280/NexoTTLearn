// Participante · bandeja (`/`). Documento canonico:
// DOCUMENTOS/doc/v2/3-pantallas/participante/bandeja/bandeja.md

import { z } from "zod"
import { bandejaStreamSchema } from "./participante-bandeja-stream"

export const bandejaSaludoSchema = z.enum(["MANANA", "TARDE", "NOCHE"])
export type BandejaSaludo = z.infer<typeof bandejaSaludoSchema>

// Estado global de la bandeja (§6).
export const bandejaEstadoSchema = z.enum([
  "VACIO",
  "ASIGNADO_NO_INICIADO",
  "EN_CURSO",
  "HITO_DESBLOQUEADO",
  "CURSO_COMPLETADO",
  "AL_DIA",
])
export type BandejaEstado = z.infer<typeof bandejaEstadoSchema>

export const bandejaHeroSchema = z.object({
  saludo: bandejaSaludoSchema,
  primerNombre: z.string().min(1),
  subtitulo: z.string().min(1),
})
export type BandejaHero = z.infer<typeof bandejaHeroSchema>

export const bandejaExpedienteResumenSchema = z.object({
  cursosCompletados: z.number().int().min(0),
  cursosEnCurso: z.number().int().min(0),
  resumen: z.string().min(1),
})
export type BandejaExpedienteResumen = z.infer<typeof bandejaExpedienteResumenSchema>

// §4.2 · Hero accionable. Variantes segun §4.2.2.
// MODULO: continuar/empezar un modulo del curso (caso normal, prio 1-5).
// TRANSVERSAL/ENTREVISTA: hito desbloqueado (prio 6-7, post-MVP en Fase 1).
// CURSO_COMPLETADO: ritual de cierre (prio 8/§6.4, post-MVP en Fase 1).
export const siguientePasoVarianteSchema = z.enum([
  "MODULO",
  "TRANSVERSAL",
  "ENTREVISTA",
  "CURSO_COMPLETADO",
])
export type SiguientePasoVariante = z.infer<typeof siguientePasoVarianteSchema>

// Estado del modulo en la card (§4.2.2). NO_INICIADO → "Comenzar",
// EN_PROGRESO → "Continuar", COMPLETADO_SIGUIENTE → modulo recien completado
// pero apuntando al siguiente (deja la barra emerald 100%).
export const siguientePasoModuloEstadoSchema = z.enum([
  "NO_INICIADO",
  "EN_PROGRESO",
  "COMPLETADO_SIGUIENTE",
])
export type SiguientePasoModuloEstado = z.infer<typeof siguientePasoModuloEstadoSchema>

// Variante MODULO. Tiene la mayoria de los datos (caso comun).
export const siguientePasoModuloSchema = z.object({
  variante: z.literal("MODULO"),
  estado: siguientePasoModuloEstadoSchema,
  /** Titulo del modulo. */
  titulo: z.string().min(1),
  /** "Curso · {empresaCliente}" ya formateado. */
  contexto: z.string().min(1),
  /** 0..100. */
  porcentajeAvance: z.number().int().min(0).max(100),
  /** CTA ya formateado: "Comenzar", "Continuar", "Siguiente modulo". */
  cta: z.string().min(1),
  /** Ruta destino (modo inmersivo). */
  href: z.string().min(1),
})
export type SiguientePasoModulo = z.infer<typeof siguientePasoModuloSchema>

// Variantes hito (placeholders, datos minimos por ahora).
export const siguientePasoHitoSchema = z.object({
  variante: z.enum(["TRANSVERSAL", "ENTREVISTA"]),
  titulo: z.string().min(1),
  contexto: z.string().min(1),
  cta: z.string().min(1),
  href: z.string().min(1),
})
export type SiguientePasoHito = z.infer<typeof siguientePasoHitoSchema>

// Variante curso completado (ritual cierre §6.4). El front igual la pinta
// como card — el estado_global=CURSO_COMPLETADO controla la celebracion.
export const siguientePasoCursoCompletadoSchema = z.object({
  variante: z.literal("CURSO_COMPLETADO"),
  titulo: z.string().min(1),
  contexto: z.string().min(1),
  cta: z.string().min(1),
  href: z.string().min(1),
})
export type SiguientePasoCursoCompletado = z.infer<typeof siguientePasoCursoCompletadoSchema>

export const bandejaSiguientePasoSchema = z.discriminatedUnion("variante", [
  siguientePasoModuloSchema,
  siguientePasoHitoSchema,
  siguientePasoCursoCompletadoSchema,
])
export type BandejaSiguientePaso = z.infer<typeof bandejaSiguientePasoSchema>

// Payload completo. siguientePaso es null cuando no hay modulo claro
// (§4.2.1 prio 9) → la pagina muestra empty state §6.1 segun `estado`.
export const participanteBandejaResponseSchema = z.object({
  estado: bandejaEstadoSchema,
  hero: bandejaHeroSchema,
  siguientePaso: bandejaSiguientePasoSchema.nullable(),
  stream: bandejaStreamSchema,
  expediente: bandejaExpedienteResumenSchema,
})
export type ParticipanteBandejaResponse = z.infer<typeof participanteBandejaResponseSchema>
