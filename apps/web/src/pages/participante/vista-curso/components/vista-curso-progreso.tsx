interface VistaCursoProgresoProps {
  readonly porcentaje: number
  readonly excelencia: boolean
}

// §4.2.4 progreso general. Bar 8px tokenizada por estado.
export function VistaCursoProgreso({ porcentaje, excelencia }: VistaCursoProgresoProps) {
  const completado = porcentaje >= 100
  const widthStyle = { width: `${Math.min(100, Math.max(0, porcentaje))}%` }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-[12px] text-text-muted uppercase tracking-[0.06em]">
          Progreso general
        </span>
        <span
          className={
            completado && excelencia
              ? "font-bold text-base text-gradient-brand tabular-nums"
              : completado
                ? "font-bold text-base text-success tabular-nums"
                : porcentaje > 0
                  ? "font-bold text-base text-brand-violet-soft tabular-nums"
                  : "font-bold text-base text-text-secondary tabular-nums"
          }
        >
          {porcentaje}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={fillClassName(completado, excelencia, porcentaje)} style={widthStyle} />
      </div>
    </div>
  )
}

function fillClassName(completado: boolean, excelencia: boolean, porcentaje: number): string {
  const base = "h-full rounded-full"
  if (completado && excelencia) {
    return `${base} bg-gradient-to-r from-brand-violet via-brand-cyan to-brand-violet bg-[length:200%_100%] [animation:shimmer_2.4s_linear_infinite]`
  }
  if (completado) {
    return `${base} bg-success`
  }
  if (porcentaje > 0) {
    return `${base} bg-gradient-to-r from-brand-violet to-brand-cyan`
  }
  return `${base} bg-text-faint`
}
