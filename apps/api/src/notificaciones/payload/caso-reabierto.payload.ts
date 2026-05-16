/**
 * Payload tipado para notificaciones `CASO_REABIERTO` (D-S11.5-A2, §19.2/§19.3).
 *
 * Tipo critico — no silenciable. Se emite al colaborador cuando el admin
 * reabre un caso cerrado (APTO/NO_APTO/COMPLETADO -> EN_PROGRESO). El motivo
 * proviene del header `X-Motivo` validado por `@RequiereMotivo()` en el
 * controller y se incluye en el payload para informar al colaborador del
 * porque del cambio (§19.3 + D-AS-14).
 *
 * Solo contiene identificadores, titulo del curso y motivo — nada de notas
 * ni datos personales (§19 + R-S10-8 + R-S11.5-3).
 */
export interface CasoReabiertoPayload {
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly motivo: string
}

export function esCasoReabiertoPayload(value: unknown): value is CasoReabiertoPayload {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const candidato = value as Record<string, unknown>
  return (
    typeof candidato.asignacionId === "string" &&
    typeof candidato.cursoId === "string" &&
    typeof candidato.cursoTitulo === "string" &&
    typeof candidato.motivo === "string"
  )
}
