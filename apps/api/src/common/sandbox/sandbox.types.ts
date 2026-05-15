import type { LenguajeEjecutable } from "@nexott-learn/shared-types"

/**
 * Contrato del sandbox de ejecucion de codigo. El motor de auto-correccion
 * de bloques CODIGO_PREGUNTAS hace una llamada por test al sandbox y compara
 * el `stdout` resultante contra `salidaEsperada`. El adaptador concreto
 * (Piston, Judge0, etc.) implementa `ISandboxService`.
 */

export interface EjecutarCodigoInput {
  readonly lenguaje: LenguajeEjecutable
  readonly codigo: string
  readonly stdin: string
  /** Timeout por ejecucion (segundos). El adaptador lo traduce al runtime. */
  readonly timeoutSeg: number
}

export interface EjecutarCodigoResultado {
  /**
   * Tres estados terminales:
   *  - "ok"       — el codigo corrio hasta el final (con o sin runtime error).
   *  - "timeout"  — el codigo no termino dentro de `timeoutSeg`.
   *  - "fallo"    — el sandbox no pudo ejecutar (compilacion, infra, etc.).
   */
  readonly estado: "ok" | "timeout" | "fallo"
  readonly stdout: string
  readonly stderr: string
  readonly duracionMs: number
  /** Codigo de salida del proceso. `null` si el sandbox no lo expone. */
  readonly exitCode: number | null
}

export const SANDBOX_SERVICE = Symbol("SANDBOX_SERVICE")

export interface ISandboxService {
  ejecutar(input: EjecutarCodigoInput): Promise<EjecutarCodigoResultado>
}
