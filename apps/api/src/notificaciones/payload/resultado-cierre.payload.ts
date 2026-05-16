/**
 * Payload tipado para notificaciones `RESULTADO_CIERRE` (D-S10-A5).
 *
 * Tipo critico — no silenciable (§19.2). El payload solo guarda identificadores
 * y el outcome textual; nada de notas, evidencias ni datos personales.
 */
export type ResultadoCierre = "APTO" | "NO_APTO" | "COMPLETADO"

export interface ResultadoCierrePayload {
  readonly asignacionId: string
  readonly cursoTitulo: string
  readonly resultado: ResultadoCierre
}

const RESULTADOS_VALIDOS: ReadonlySet<string> = new Set<ResultadoCierre>([
  "APTO",
  "NO_APTO",
  "COMPLETADO",
])

export function esResultadoCierrePayload(value: unknown): value is ResultadoCierrePayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.asignacionId === "string" &&
    typeof candidato.cursoTitulo === "string" &&
    typeof candidato.resultado === "string" &&
    RESULTADOS_VALIDOS.has(candidato.resultado)
  )
}
