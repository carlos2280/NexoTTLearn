/**
 * Marca de celda de un bloque evaluable: el glifo de color + la etiqueta mono
 * con que se anuncia en el "archivo" (`? quiz`, `> ejercicio de código`).
 * Centraliza el mapeo para que los tres estados de un evaluable —activo,
 * cerrado (lectura) y preview (bloqueado)— se lean con el mismo lenguaje.
 */
export interface MarcaCelda {
  readonly glifo: string
  readonly etiqueta: string
}

export const MARCA_QUIZ: MarcaCelda = { glifo: "?", etiqueta: "quiz" }

export const MARCA_CODIGO: MarcaCelda = {
  glifo: ">",
  etiqueta: "ejercicio de código",
}
