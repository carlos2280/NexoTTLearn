import { z } from "zod"

// Iconos y colores que entiende la libreria nexott-ui (subset usado por la bandeja).
// Mantener sincronizado con NxtIconoNombre, NxtIconTileGradient, etc. — cuando
// nexott-ui exponga estos enums via shared, se reemplazan por z.string()
// estricto + el tipo importado en el frontend.
const iconoNombreSchema = z.string().min(1)
const tileGradientSchema = z.enum(["indigo", "violet", "emerald", "amber", "rose", "teal"])
const colorKpiSchema = z.enum(["indigo", "emerald", "violet", "amber", "rose"])
const trendSchema = z.enum(["up", "down", "neutral"])
const tagVariantSchema = z.enum(["info", "warning", "critical", "success", "neutral"])
const highlightToneSchema = z.enum(["emerald", "amber", "rose", "violet", "indigo", "neutral"])

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
