/**
 * Prefijo de comentario de línea según el lenguaje, para construir placeholders
 * de código coherentes (en Python `//` no es comentario, es `#`). Cae a `//`
 * para JS/TS y cualquier otro lenguaje tipo C.
 */
const COMENTARIO_POR_LENGUAJE: Record<string, string> = {
  python: "#",
}

export function comentarioLinea(lenguaje: string): string {
  return COMENTARIO_POR_LENGUAJE[lenguaje] ?? "//"
}
