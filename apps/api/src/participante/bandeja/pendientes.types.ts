// Tipos compartidos para el calculo de pendientes (§4.3.1).

import type { PendienteTag, PendienteTipo } from "@nexott-learn/shared-types"

export interface PendienteCrudo {
  readonly bloqueId: string
  readonly seccionId: string
  readonly moduloId: string
  readonly inscripcionId: string
  readonly cursoId: string
  readonly tipoBloque: "QUIZ" | "CODIGO" | "PARRAFO" | "TIP" | "VIDEO" | "RECURSO"
  readonly codigoEvaluable: "NINGUNO" | "PREGUNTAS" | "TESTS" | null
  readonly tituloModulo: string
  readonly tituloCurso: string
  readonly empresaCliente: string
  readonly cursoDeadline: Date | null
  readonly intentosPrevios: number
}

export function mapearTipoBloqueAPendienteTipo(
  tipo: PendienteCrudo["tipoBloque"],
  codigoEvaluable: PendienteCrudo["codigoEvaluable"],
): PendienteTipo {
  switch (tipo) {
    case "QUIZ":
      return "TEST"
    case "CODIGO":
      return codigoEvaluable === "PREGUNTAS" ? "RETO" : "EJERCICIO"
    case "VIDEO":
      return "VIDEO"
    default:
      return "LECTURA"
  }
}

export function etiquetaPendienteTipo(tipo: PendienteTipo): string {
  switch (tipo) {
    case "EJERCICIO":
      return "Ejercicio"
    case "TEST":
      return "Test"
    case "LECTURA":
      return "Lectura"
    case "RETO":
      return "Reto"
    case "VIDEO":
      return "Video"
    case "MODULO":
      return "Modulo"
    case "PROYECTO":
      return "Proyecto"
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

export function ctaPorTag(tag: PendienteTag): string {
  switch (tag) {
    case "URGENTE":
    case "PENDIENTE":
      return "Comenzar"
    case "RETOMAR":
      return "Retomar"
    default: {
      const _exhaustive: never = tag
      return _exhaustive
    }
  }
}
