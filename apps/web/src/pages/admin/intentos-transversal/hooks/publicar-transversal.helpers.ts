export const NOTA_MIN = 0
export const NOTA_MAX = 100
export const MOTIVO_AJUSTE_MAX = 500

export interface EstadoPublicacion {
  /** El admin cambió la nota respecto de la que calculó la IA (o la fijó a mano). */
  readonly ajustada: boolean
  /** La nota que se publicaría (parseada), o `null` si el input no es válido. */
  readonly notaFinal: number | null
  /** Si esa nota aprobaría (>= umbral). `null` cuando la nota aún no es válida. */
  readonly aprobaria: boolean | null
  readonly errorNota: string | null
  readonly errorMotivo: string | null
  readonly puedePublicar: boolean
  /** Cuerpo para `finalizar`: vacío si publica la calculada tal cual (nunca `null`). */
  readonly body: { notaAjustada?: number; motivoAjuste?: string }
}

function parsearNota(notaStr: string): number | null {
  const trimmed = notaStr.trim()
  if (trimmed === "") {
    return null
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= NOTA_MIN && parsed <= NOTA_MAX ? parsed : null
}

function errorDeNota(notaStr: string, notaFinal: number | null): string | null {
  if (notaFinal !== null) {
    return null
  }
  return notaStr.trim() === ""
    ? "Escribe una nota para publicar."
    : `La nota debe ser un número entre ${NOTA_MIN} y ${NOTA_MAX}.`
}

function errorDeMotivo(ajustada: boolean, motivoLimpio: string): string | null {
  if (!ajustada) {
    return null
  }
  if (motivoLimpio.length === 0) {
    return "Explica por qué cambias la nota (el motivo queda en la auditoría)."
  }
  if (motivoLimpio.length > MOTIVO_AJUSTE_MAX) {
    return `El motivo no puede superar los ${MOTIVO_AJUSTE_MAX} caracteres.`
  }
  return null
}

/**
 * Deriva el estado del diálogo "Publicar y cerrar" a partir de los inputs y la
 * nota que calculó la IA. Reglas: la nota debe ser un número 0-100; si el admin
 * la cambia (o la IA no pudo calcular ninguna), el motivo es obligatorio; cuando
 * NO se ajusta, el cuerpo va vacío (se omiten los campos, nunca se manda `null`).
 * Función pura para poder testearla sin montar el diálogo.
 */
export function derivarPublicacion(input: {
  readonly notaStr: string
  readonly motivo: string
  readonly notaCalculada: number | null
  readonly umbral: number
}): EstadoPublicacion {
  const notaFinal = parsearNota(input.notaStr)
  // Ajustada = cambió respecto de la calculada, o la IA no dio nota y el admin la fija.
  const ajustada = notaFinal !== null && notaFinal !== input.notaCalculada
  const motivoLimpio = input.motivo.trim()

  const errorNota = errorDeNota(input.notaStr, notaFinal)
  const errorMotivo = errorDeMotivo(ajustada, motivoLimpio)

  return {
    ajustada,
    notaFinal,
    aprobaria: notaFinal === null ? null : notaFinal >= input.umbral,
    errorNota,
    errorMotivo,
    puedePublicar: errorNota === null && errorMotivo === null,
    // Seguro por construcción: solo lleva ajuste cuando la nota cambió Y el motivo
    // es válido; en cualquier otro caso va vacío (publica la calculada tal cual).
    body:
      ajustada && notaFinal !== null && errorMotivo === null
        ? { notaAjustada: notaFinal, motivoAjuste: motivoLimpio }
        : {},
  }
}
