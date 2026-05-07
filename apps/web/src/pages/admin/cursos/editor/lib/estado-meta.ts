import type { CursoDetalle } from "@nexott-learn/shared-types"

export interface EstadoMeta {
  readonly label: string
  readonly classes: string
  readonly dot: string
}

export function estadoMeta(estado: CursoDetalle["estado"]): EstadoMeta {
  switch (estado) {
    case "BORRADOR":
      return {
        label: "Borrador",
        classes: "bg-glass-2 text-text-secondary border border-glass-border",
        dot: "var(--text-muted)",
      }
    case "ACTIVO":
      return {
        label: "Activo",
        classes: "bg-success/10 text-success border border-success/30",
        dot: "var(--success)",
      }
    case "CERRADO":
      return {
        label: "Cerrado",
        classes: "bg-glass-2 text-text-muted border border-glass-border",
        dot: "var(--text-faint)",
      }
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
