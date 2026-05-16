import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { ejecutarSuite } from "../ejecutar-suite"
import type { InputEjecucionSuite, ResultadoEjecucionSuite } from "../types"

/**
 * Hook expuesto al componente que renderiza un `CODIGO_PREGUNTAS` con tests.
 * No es una `query` (no carga datos del servidor): es una `mutation` porque
 * el participante dispara la ejecución con un botón. El estado de pending /
 * error / data lo gestiona Tanstack Query igual que cualquier otra mutación.
 *
 * Errores del worker (fallo de carga de Pyodide, error de transpilación TS)
 * llegan como `error` de la mutation. Los errores del propio código del
 * participante (excepciones runtime, timeouts) viven dentro de `data` como
 * resultados de tests con `paso=false` y `estado=fallo|timeout`.
 */
export function useEjecutarCodigo(): UseMutationResult<
  ResultadoEjecucionSuite,
  Error,
  InputEjecucionSuite
> {
  return useMutation<ResultadoEjecucionSuite, Error, InputEjecucionSuite>({
    mutationFn: (input) => ejecutarSuite(input),
  })
}
