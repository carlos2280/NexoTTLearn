import { z } from "zod"

// Iconos y colores que entiende la libreria nexott-ui (subset usado por la bandeja).
// Mantener sincronizado con NxtIconoNombre, NxtIconTileGradient,
// NxtStreamTagVariant, NxtStreamHighlightTone (definidos en
// `@carlos2280/nexott-ui`).
//
// `iconoNombreSchema` se queda laxo (z.string) porque el catalogo de iconos
// vive en la libreria visual y shared-types no debe dependerle. El frontend
// re-tipa el campo al consumirlo.
//
// El resto son enums cerrados que copiamos textualmente del DS para que el
// contrato sea exhaustivo y cualquier desincronizacion salte en compilacion.
const iconoNombreSchema = z.string().min(1)
const tileGradientSchema = z.enum([
  "indigo",
  "violet",
  "emerald",
  "amber",
  "rose",
  "sky",
  "slate",
  "brand",
])
const colorKpiSchema = z.enum(["indigo", "emerald", "violet", "amber", "rose"])
const trendSchema = z.enum(["up", "down", "neutral"])
const tagVariantSchema = z.enum(["critical", "warning", "info", "success", "secondary", "neutral"])
const highlightToneSchema = z.enum(["emerald", "amber", "rose", "indigo", "violet", "neutral"])

export const dashboardKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  icon: iconoNombreSchema,
  color: colorKpiSchema,
  delta: z.string().optional(),
  trend: trendSchema.optional(),
  helper: z.string().optional(),
  href: z.string().optional(),
  trendData: z.array(z.number()).optional(),
})
export type DashboardKpi = z.infer<typeof dashboardKpiSchema>

export const dashboardColaItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number().int().min(0),
  icon: iconoNombreSchema,
  tone: z.enum(["amber", "rose"]),
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
  meta: z.string(),
  icon: iconoNombreSchema,
  gradient: tileGradientSchema,
  tag: z.string(),
  tagVariant: tagVariantSchema,
  action: z.string(),
  href: z.string(),
})
export type DashboardAlerta = z.infer<typeof dashboardAlertaSchema>

export const dashboardActividadSchema = z.object({
  id: z.string(),
  title: z.string(),
  highlight: z.string().optional(),
  highlightTone: highlightToneSchema.optional(),
  meta: z.string(),
  icon: iconoNombreSchema,
  gradient: tileGradientSchema,
})
export type DashboardActividad = z.infer<typeof dashboardActividadSchema>

export const adminDashboardResponseSchema = z.object({
  kpis: z.array(dashboardKpiSchema),
  colaRevision: dashboardColaRevisionSchema,
  alertas: z.array(dashboardAlertaSchema),
  actividad: z.array(dashboardActividadSchema),
})
export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>
