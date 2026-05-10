import type { CursoEstado } from "@nexott-learn/shared-types"

interface CourseCardProgressProps {
  readonly estado: CursoEstado
}

// Bar de progreso por estado §4.5.2. Excelencia = gradiente espectral + shimmer.
export function CourseCardProgress({ estado }: CourseCardProgressProps) {
  const porcentaje = porcentajePorEstado(estado)
  const widthStyle = { width: `${porcentaje}%` }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div className={fillClassName(estado)} style={widthStyle} />
    </div>
  )
}

function porcentajePorEstado(estado: CursoEstado): number {
  switch (estado.tipo) {
    case "NO_INICIADO":
      return 0
    case "EN_PROGRESO":
      return estado.porcentajeAvance
    case "COMPLETADO":
      return 100
    case "ABANDONADO":
    case "CERRADO_SIN_COMPLETAR":
      return 0
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}

function fillClassName(estado: CursoEstado): string {
  const base = "h-full rounded-full"
  switch (estado.tipo) {
    case "NO_INICIADO":
      return `${base} bg-text-faint`
    case "EN_PROGRESO":
      return `${base} bg-gradient-to-r from-brand-violet to-brand-cyan`
    case "COMPLETADO": {
      if (estado.excelencia) {
        return `${base} bg-gradient-to-r from-brand-violet via-brand-cyan to-brand-violet bg-[length:200%_100%] [animation:shimmer_2.4s_linear_infinite]`
      }
      return `${base} bg-success`
    }
    case "ABANDONADO":
    case "CERRADO_SIN_COMPLETAR":
      return `${base} bg-text-faint/50`
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
