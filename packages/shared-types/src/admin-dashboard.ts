import { z } from "zod"

// Vocabulario semantico unificado para tonos visuales del dashboard admin.
// El back NO emite paletas crudas (indigo/violet/...) — emite intencion
// (brand/success/warning/danger/info/neutral) y el front decide el color
// segun tema (dark/light) usando los tokens del DS.
//
// Manifiesto §1.1 ("color con funcion") y §5.4 (dark/light): el contrato
// debe sobrevivir a un retoque de paleta sin obligar al back a reemitir.
const toneSchema = z.enum(["brand", "success", "warning", "danger", "info", "neutral"])
const trendSchema = z.enum(["up", "down", "neutral"])

// Iconos: nombres del catalogo Lucide (manifiesto §3). shared-types se queda
// laxo (z.string) porque el catalogo de iconos vive en el front; el contrato
// sobrevive a renames de iconos sin romper.
const iconoNombreSchema = z.string().min(1)

export const dashboardKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Valor ya formateado para pintar (ej: "47", "82%"). */
  value: z.string(),
  icon: iconoNombreSchema,
  tone: toneSchema,
  /** Delta ya formateado (ej: "+2", "-1", "="). Opcional cuando no hay historia. */
  delta: z.string().optional(),
  trend: trendSchema.optional(),
  /** Contexto secundario ya formateado (ej: "publicados", "39 de 47"). */
  helper: z.string().optional(),
  href: z.string().optional(),
  /** Serie cruda para sparkline. El front decide stroke/fill segun `tone`. */
  trendData: z.array(z.number()).optional(),
})
export type DashboardKpi = z.infer<typeof dashboardKpiSchema>

export const dashboardColaItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number().int().min(0),
  icon: iconoNombreSchema,
  tone: toneSchema,
  href: z.string(),
})
export type DashboardColaItem = z.infer<typeof dashboardColaItemSchema>

export const dashboardColaRevisionSchema = z.object({
  title: z.string(),
  description: z.string(),
  href: z.string(),
  items: z.array(dashboardColaItemSchema),
})
export type DashboardColaRevision = z.infer<typeof dashboardColaRevisionSchema>

export const dashboardAlertaSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Meta ya formateada (ej: "Frontend · hace 12 min"). */
  meta: z.string(),
  icon: iconoNombreSchema,
  tone: toneSchema,
  /** Etiqueta de severidad ya formateada (ej: "Critica", "Media"). */
  tag: z.string(),
  tagTone: toneSchema,
  /** Texto del CTA ya formateado (ej: "Revisar"). */
  action: z.string(),
  href: z.string(),
})
export type DashboardAlerta = z.infer<typeof dashboardAlertaSchema>

export const dashboardActividadSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Fragmento destacado dentro del titulo (ej: "82/100"). El front lo pinta con `highlightTone`. */
  highlight: z.string().optional(),
  highlightTone: toneSchema.optional(),
  /** Meta ya formateada (ej: "Backend Java · Maria R. · hace 2h"). */
  meta: z.string(),
  icon: iconoNombreSchema,
  tone: toneSchema,
})
export type DashboardActividad = z.infer<typeof dashboardActividadSchema>

export const adminDashboardResponseSchema = z.object({
  kpis: z.array(dashboardKpiSchema),
  // colaRevision queda opcional para soportar dos modos de UI:
  // 1) banner-CTA explicito (bandeja v2 §4.3) — se emite con counts.
  // 2) integrado en KPIs via `urgentCount` (rediseño futuro) — se omite.
  colaRevision: dashboardColaRevisionSchema.optional(),
  alertas: z.array(dashboardAlertaSchema),
  actividad: z.array(dashboardActividadSchema),
})
export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>
