// Tipos del dominio Diagnostico. Alineados con los contratos cerrados en
// memory/decision_diagnostico_contratos.md y MAPA-FRONT-BACK §9 + propuestas
// 3.2 / 3.3 / 3.5 del reporte. Cuando el back exista, mover a shared-types.

export type EstadoInvitado = "sin-login" | "con-login-sin-eval" | "con-login-con-eval"

export interface ParticipanteDiagnostico {
  readonly id: string
  readonly nombre: string
  readonly apellido: string
  readonly email: string
  readonly ultimoLoginAt?: string
}

export interface InscripcionDiagnostico {
  readonly inscripcionId: string
  readonly participante: ParticipanteDiagnostico
  readonly estadoInvitado: EstadoInvitado
  readonly invitadaAt: string
  readonly evaluacion: {
    readonly areasConDato: number
    readonly areasTotales: number
    readonly completa: boolean
  }
  readonly asignacion: {
    readonly confirmada: boolean
    readonly modulosCount: number
  }
}

export type SemaforoCelda = "verde" | "amarillo" | "rojo" | "vacio"

export interface AreaDiagnostico {
  readonly id: string
  readonly nombre: string
  readonly color: string
  readonly puntajeObjetivo: number
}

export interface CeldaEvaluacion {
  readonly areaId: string
  readonly nota?: number
  readonly semaforo: SemaforoCelda
}

export interface FilaMatrizDiagnostico {
  readonly inscripcionId: string
  readonly participante: ParticipanteDiagnostico
  readonly celdas: readonly CeldaEvaluacion[]
  readonly cobertura: { readonly capturadas: number; readonly total: number }
}

export type TipoAsignacion = "OBLIGATORIO" | "RECOMENDADO" | "OPCIONAL"
export type MotivoSugerencia = "NO_CUMPLE" | "CERCA" | "SIN_DATO"

export interface SugerenciaModulo {
  readonly moduloId: string
  readonly moduloTitulo: string
  readonly areaId: string
  readonly tipo: TipoAsignacion
  readonly motivo: MotivoSugerencia
}

export interface AsignacionConfirmada {
  readonly moduloId: string
  readonly tipo: TipoAsignacion
}

export interface TarjetaAsignacion {
  readonly inscripcionId: string
  readonly participante: ParticipanteDiagnostico
  readonly tieneEvaluacion: boolean
  readonly sugerencias: readonly SugerenciaModulo[]
  readonly confirmadas: readonly AsignacionConfirmada[]
  readonly cumple: readonly { readonly areaId: string; readonly areaNombre: string }[]
}

export interface CursoDiagnostico {
  readonly cursoId: string
  readonly empresaCliente: string
  readonly titulo: string
  readonly estado: "BORRADOR" | "ACTIVO" | "CERRADO"
  readonly deadline?: string
  readonly diasRestantes?: number
  readonly areas: readonly AreaDiagnostico[]
}

export interface DiagnosticoData {
  readonly curso: CursoDiagnostico
  readonly inscripciones: readonly InscripcionDiagnostico[]
  readonly matriz: readonly FilaMatrizDiagnostico[]
  readonly asignaciones: readonly TarjetaAsignacion[]
}

export type TabDiagnostico = 1 | 2 | 3
