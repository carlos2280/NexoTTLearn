// Participante · stream §4.3 (Pendientes / Novedades).
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/bandeja/bandeja.md

import { z } from "zod"

// §4.3.1 — tipos de pendiente que se renderizan en la franja izquierda.
// Mapean del tipo de bloque a la categoria visual del doc canonico.
export const pendienteTipoSchema = z.enum([
  "EJERCICIO",
  "TEST",
  "LECTURA",
  "RETO",
  "VIDEO",
  "MODULO",
  "PROYECTO",
])
export type PendienteTipo = z.infer<typeof pendienteTipoSchema>

// §4.3.1 tags de estado.
export const pendienteTagSchema = z.enum(["URGENTE", "PENDIENTE", "RETOMAR"])
export type PendienteTag = z.infer<typeof pendienteTagSchema>

export const pendienteItemSchema = z.object({
  id: z.string().min(1),
  tipo: pendienteTipoSchema,
  /** Etiqueta del chip ya formateada ("Ejercicio", "Test", etc.). */
  tipoLabel: z.string().min(1),
  /** Titulo del bloque/modulo/proyecto. */
  titulo: z.string().min(1),
  /** Contexto: "Curso · Modulo · Vence hoy" formateado. */
  contexto: z.string().min(1),
  tag: pendienteTagSchema,
  /** Texto del CTA: "Comenzar", "Continuar", "Retomar". */
  cta: z.string().min(1),
  href: z.string().min(1),
})
export type PendienteItem = z.infer<typeof pendienteItemSchema>

// §4.3.2 — tipos canonicos de novedad. Mapean 1:1 con TipoNotificacion del
// schema (subset participante).
export const novedadTipoSchema = z.enum([
  "EVALUADO",
  "DESBLOQUEADO",
  "FEEDBACK",
  "ASIGNADO",
  "DIAGNOSTICO",
  "RECALCULO",
  "CURSO_COMPLETADO",
])
export type NovedadTipo = z.infer<typeof novedadTipoSchema>

export const novedadItemSchema = z.object({
  id: z.string().min(1),
  tipo: novedadTipoSchema,
  /** Texto principal ya formateado. */
  titulo: z.string().min(1),
  /** Tiempo relativo ya formateado ("hace 2 horas"). */
  meta: z.string().min(1),
  /** Resultado destacado ya formateado ("92/100", "Nuevo", "+5"). Opcional. */
  resultado: z.string().optional(),
  leida: z.boolean(),
  href: z.string().min(1),
})
export type NovedadItem = z.infer<typeof novedadItemSchema>

export const bandejaStreamSchema = z.object({
  pendientes: z.array(pendienteItemSchema),
  novedades: z.array(novedadItemSchema),
  /** Total de novedades no-leidas (para el badge del tab §4.3). */
  novedadesNoLeidas: z.number().int().min(0),
})
export type BandejaStream = z.infer<typeof bandejaStreamSchema>
