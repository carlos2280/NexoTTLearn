import type { ResultadoEjecucionSuite } from "@/features/codigo-ejecucion"
import type { ResultadoTestGuardado } from "@nexott-learn/shared-types"

/**
 * Reconstruye un `ResultadoEjecucionSuite` (lo que pinta `<TerminalTests>`) a
 * partir de los `resultadosTests` guardados de un intento de código (P21). El
 * shape guardado es idéntico al `ResultadoTestUI` que la terminal ya consume,
 * así que se muestra sin remapear — y la terminal sigue ocultando el esperado
 * de los tests `visible:false` (no revela los casos ocultos).
 */
export function reconstruirEjecucion(
  resultados: readonly ResultadoTestGuardado[],
): ResultadoEjecucionSuite {
  return {
    resultados,
    testsPasados: resultados.filter((r) => r.paso).length,
    testsTotales: resultados.length,
  }
}
