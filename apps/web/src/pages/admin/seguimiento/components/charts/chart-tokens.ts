/**
 * Tokens compartidos por todos los charts del seguimiento.
 * Lee del CSS via getComputedStyle para mantenerse coherente con tema dark/light.
 */

export const CHART_COLORS = {
  brandViolet: "#7c3aed",
  brandCyan: "#22d3ee",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#f43f5e",
  info: "#38bdf8",
  gridDark: "rgba(255,255,255,0.06)",
  axisDark: "rgba(255,255,255,0.4)",
} as const

export const GRADIENT_IDS = {
  brand: "nx-grad-brand",
  brandSoft: "nx-grad-brand-soft",
  success: "nx-grad-success",
} as const

export const CHART_FONT = {
  family: "'Inter', system-ui, sans-serif",
  sizeAxis: 11,
  sizeLabel: 12,
} as const
