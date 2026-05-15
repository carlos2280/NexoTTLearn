import type { TestStdinStdout } from "@nexott-learn/shared-types"
import type { ResultadoEjecucion } from "./types"

/**
 * Comparación stdout obtenido vs esperado. Reglas — espejo exacto del
 * evaluador antiguo del backend, para que la nota recalculada por el server
 * coincida con la calculada por el cliente:
 *  - El test pasa si el código terminó en `estado: "ok"` Y el stdout
 *    normalizado coincide con la salida esperada normalizada.
 *  - Normalización: convertir `\r\n` → `\n` y recortar espacios/saltos al
 *    final. NO se recorta el principio.
 */
export function decidirPaso(resultado: ResultadoEjecucion, test: TestStdinStdout): boolean {
  if (resultado.estado !== "ok") {
    return false
  }
  return normalizarStdout(resultado.stdout) === normalizarStdout(test.salidaEsperada)
}

export function normalizarStdout(valor: string): string {
  return valor.replace(/\r\n/g, "\n").replace(/\s+$/g, "")
}
