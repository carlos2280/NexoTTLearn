import type { LenguajeEjecutable, TestStdinStdout } from "@nexott-learn/shared-types"

/**
 * Tipos del módulo `codigo-ejecucion` — ejecuta el código del participante
 * en el navegador (Pyodide para Python, Web Worker para JS/TS) y reporta los
 * resultados al backend. El backend recalcula la nota desde `paso`, nunca
 * confía en una nota agregada del cliente.
 */

export interface SolicitudEjecucion {
  readonly id: string
  readonly lenguaje: LenguajeEjecutable
  readonly codigo: string
  readonly stdin: string
  readonly timeoutMs: number
}

export interface ResultadoEjecucion {
  readonly id: string
  readonly estado: "ok" | "timeout" | "fallo"
  readonly stdout: string
  readonly stderr: string
  readonly duracionMs: number
}

/**
 * Resultado por test enriquecido para mostrar al participante. Comparte la
 * misma estructura que `ResultadoTestReportado` (lo que viaja al backend)
 * pero añade `descripcion` y `visible` para uso de la UI.
 */
export interface ResultadoTestUI {
  readonly testId: string
  readonly descripcion: string
  readonly visible: boolean
  readonly paso: boolean
  readonly estado: "ok" | "timeout" | "fallo"
  readonly stdoutObtenido: string
  readonly stdoutEsperado: string
  readonly stderr: string
  readonly duracionMs: number
}

export interface InputEjecucionSuite {
  readonly lenguaje: LenguajeEjecutable
  readonly codigo: string
  readonly tests: readonly TestStdinStdout[]
  readonly timeoutSegPorTest: number
}

export interface ResultadoEjecucionSuite {
  readonly resultados: readonly ResultadoTestUI[]
  readonly testsPasados: number
  readonly testsTotales: number
}
