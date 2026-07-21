import type { ResultadoEjecucionSuite } from "@/features/codigo-ejecucion"

export interface FalloValidacion {
  /** Posición 1-based del test, igual que la numeración del editor. */
  readonly numero: number
  readonly estado: "ok" | "timeout" | "fallo"
  readonly stderr: string
}

export interface ResumenValidacion {
  readonly ok: boolean
  readonly totales: number
  readonly pasados: number
  readonly fallidos: readonly FalloValidacion[]
  /** La solución no llegó a ejecutar en ningún test (todos timeout/fallo, ninguno
   *  con salida distinta): más probable un error de compilación o de entorno
   *  (p. ej. Pyodide no cargó) que "la salida no coincide". Sirve para no acusar
   *  a la solución de "fallar un test" cuando en realidad no corrió. */
  readonly noEjecuta: boolean
}

/**
 * Resume la validación de la solución de referencia contra sus tests: cuáles
 * falla y por qué. Si `fallidos` está vacío, la solución pasa todos → el reto se
 * puede publicar sin sorpresas. Los tres contadores se derivan de `resultados`
 * (no de los agregados) para que no puedan divergir. Pura, testeable sin DOM.
 */
export function resumirValidacionReferencia(resultado: ResultadoEjecucionSuite): ResumenValidacion {
  const fallidos = resultado.resultados
    .map((r, i) => ({ numero: i + 1, paso: r.paso, estado: r.estado, stderr: r.stderr }))
    .filter((r) => !r.paso)
    .map(({ numero, estado, stderr }) => ({ numero, estado, stderr }))
  const totales = resultado.resultados.length
  const pasados = totales - fallidos.length
  const noEjecuta =
    totales > 0 && fallidos.length === totales && fallidos.every((f) => f.estado !== "ok")
  return { ok: fallidos.length === 0, totales, pasados, fallidos, noEjecuta }
}
