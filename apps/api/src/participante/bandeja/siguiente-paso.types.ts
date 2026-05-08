// Tipos compartidos entre el query y el selector del "siguiente paso".

export interface ModuloAsignado {
  readonly inscripcionId: string
  readonly moduloId: string
  readonly tipoAsignacion: "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL"
  readonly tituloModulo: string
  readonly tituloCurso: string
  readonly empresaCliente: string
  readonly cursoId: string
  readonly cursoDeadline: Date | null
  readonly estadoModulo: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO"
  readonly porcentajeAvance: number
  readonly ordenModulo: number
}

// §4.2.1 prio 3-5: OBLIGATORIO antes que RECOMENDADO antes que OPCIONAL.
export function prioridadTipoAsignacion(tipo: ModuloAsignado["tipoAsignacion"]): number {
  switch (tipo) {
    case "OBLIGATORIO":
      return 0
    case "RECOMENDADO":
      return 1
    case "OPCIONAL":
      return 2
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

export function fechaMs(d: Date | null): number {
  return d ? d.getTime() : Number.POSITIVE_INFINITY
}
