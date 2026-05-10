import type {
  VistaMiniProyectoEstado,
  VistaModuloEstado,
  VistaModuloTagAsignacion,
} from "@nexott-learn/shared-types"

export function tagAsignacionClassName(tag: VistaModuloTagAsignacion): string {
  switch (tag) {
    case "OBLIGATORIO":
      return "border-brand-violet/25 bg-brand-violet/12 text-brand-violet-soft"
    case "RECOMENDADO":
      return "border-warning/25 bg-warning/12 text-warning"
    case "OPCIONAL":
      return "border-glass-border bg-surface-2 text-text-muted"
    case "OPCIONAL_LIBRE":
      return "border-brand-cyan/25 bg-brand-cyan/12 text-brand-cyan"
    default: {
      const _exhaustive: never = tag
      return _exhaustive
    }
  }
}

export function tagAsignacionLabel(tag: VistaModuloTagAsignacion): string {
  switch (tag) {
    case "OBLIGATORIO":
      return "Obligatorio"
    case "RECOMENDADO":
      return "Recomendado"
    case "OPCIONAL":
    case "OPCIONAL_LIBRE":
      return "Opcional"
    default: {
      const _exhaustive: never = tag
      return _exhaustive
    }
  }
}

export function moduloProgressFill(estado: VistaModuloEstado, excelencia: boolean): string {
  const base = "h-full rounded-full"
  switch (estado) {
    case "NO_INICIADO":
      return `${base} bg-text-faint`
    case "EN_PROGRESO":
      return `${base} bg-gradient-to-r from-brand-violet to-brand-cyan`
    case "COMPLETADO":
      return excelencia
        ? `${base} bg-gradient-to-r from-brand-violet via-brand-cyan to-brand-violet bg-[length:200%_100%] [animation:shimmer_2.4s_linear_infinite]`
        : `${base} bg-success`
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}

export function miniProyectoIconColor(estado: VistaMiniProyectoEstado): string {
  switch (estado) {
    case "BLOQUEADO":
      return "text-text-muted"
    case "DISPONIBLE":
      return "text-brand-cyan"
    case "EN_REVISION":
      return "text-warning"
    case "APROBADO":
      return "text-success"
    case "REPROBADO":
      return "text-danger"
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
