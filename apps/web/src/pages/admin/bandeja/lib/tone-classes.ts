// Mapeo de los tonos semanticos del back (brand/success/warning/danger/info/neutral)
// a clases Tailwind. Vive aqui (no en patterns) porque hoy solo lo usa la
// bandeja; si una segunda pantalla lo necesita, sube a shared/.

import type { DashboardKpi } from "@nexott-learn/shared-types"

type Tone = DashboardKpi["tone"]

export function classesIconWrap(tone: Tone): string {
  switch (tone) {
    case "brand":
      return "bg-[rgb(124_58_237/0.12)] text-brand-violet-soft"
    case "success":
      return "bg-[var(--success-bg)] text-success"
    case "warning":
      return "bg-[var(--warning-bg)] text-warning"
    case "danger":
      return "bg-[var(--danger-bg)] text-danger"
    case "info":
      return "bg-[var(--info-bg)] text-info"
    case "neutral":
      return "bg-glass-2 text-text-muted"
    default:
      return "bg-glass-2 text-text-muted"
  }
}

export function classesBadge(tone: Tone): string {
  // Borde derivado del color de texto a 32% de opacidad via `currentColor` —
  // evita inventar tokens `*-border` que no existen en tokens.css.
  switch (tone) {
    case "brand":
      return "bg-[rgb(124_58_237/0.16)] text-brand-violet-soft border-[currentColor]/30"
    case "success":
      return "bg-[var(--success-bg)] text-success border-[currentColor]/30"
    case "warning":
      return "bg-[var(--warning-bg)] text-warning border-[currentColor]/30"
    case "danger":
      return "bg-[var(--danger-bg)] text-danger border-[currentColor]/30"
    case "info":
      return "bg-[var(--info-bg)] text-info border-[currentColor]/30"
    case "neutral":
      return "bg-glass-2 text-text-muted border-glass-border"
    default:
      return "bg-glass-2 text-text-muted border-glass-border"
  }
}

export function classesBorderLeft(tone: Tone): string {
  switch (tone) {
    case "brand":
      return "border-l-brand-violet-soft"
    case "success":
      return "border-l-success"
    case "warning":
      return "border-l-warning"
    case "danger":
      return "border-l-danger"
    case "info":
      return "border-l-info"
    case "neutral":
      return "border-l-glass-border-strong"
    default:
      return "border-l-glass-border-strong"
  }
}

export function classesHighlight(tone: Tone): string {
  switch (tone) {
    case "brand":
      return "text-brand-violet-soft"
    case "success":
      return "text-success"
    case "warning":
      return "text-warning"
    case "danger":
      return "text-danger"
    case "info":
      return "text-info"
    case "neutral":
      return "text-text-secondary"
    default:
      return "text-text-secondary"
  }
}
