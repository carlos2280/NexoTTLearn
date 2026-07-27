import {
  type BloqueDetalleResponse,
  type LenguajeEjecutable,
  type TestStdinStdout,
  contenidoCodigoPreguntasSchema,
  contenidoCodigoTestsSchema,
  lenguajeEjecutableSchema,
} from "@nexott-learn/shared-types"

export interface RetoValidable {
  readonly lenguaje: LenguajeEjecutable
  readonly solucionReferencia: string
  readonly tests: readonly TestStdinStdout[]
  /** El del propio reto: validar con el límite real del participante evita falsos rojos/verdes. */
  readonly tiempoLimiteSeg: number
}

/**
 * Por qué no se pudo validar. Importa distinguirlos: `lenguaje` NO es un
 * problema del contenido (el reto puede estar perfecto, solo que el runner del
 * navegador no cubre ese lenguaje), mientras que `sin-tests` y `sin-solucion`
 * sí dejan al alumno con un reto que la plataforma nunca podrá corregirle.
 */
export type MotivoNoValidable = "lenguaje" | "sin-tests" | "sin-solucion" | "formato" | "ausente"

export type Emparejamiento =
  | { readonly ok: true; readonly reto: RetoValidable }
  | { readonly ok: false; readonly motivo: string; readonly codigo: MotivoNoValidable }

/**
 * Reconstruye lo que hace falta para validar un reto a partir de los bloques
 * de su sección: el reto son DOS bloques hermanos, `CODIGO_PREGUNTAS`
 * (lenguaje + tiempo límite) y `CODIGO_TESTS` (solución de referencia + tests),
 * enlazados por `codigoPreguntasId`. Hay que emparejarlos en cliente.
 *
 * Devuelve un motivo legible en vez de lanzar: un reto no autocorregible o sin
 * tests enlazados NO es un error de la herramienta, es información que el
 * admin necesita ver en su fila.
 *
 * Pura: sin fetch, sin DOM.
 */
export function emparejarReto(
  bloquesDeLaSeccion: readonly BloqueDetalleResponse[],
  bloqueId: string,
): Emparejamiento {
  const bloquePregunta = bloquesDeLaSeccion.find((b) => b.id === bloqueId)
  if (!bloquePregunta) {
    return { ok: false, codigo: "ausente", motivo: "El reto ya no está activo en su sección." }
  }

  const pregunta = contenidoCodigoPreguntasSchema.safeParse(bloquePregunta.contenido)
  if (!pregunta.success) {
    return {
      ok: false,
      codigo: "formato",
      motivo: "El contenido del reto no tiene el formato esperado.",
    }
  }

  const lenguaje = lenguajeEjecutableSchema.safeParse(pregunta.data.lenguaje)
  if (!lenguaje.success) {
    return {
      ok: false,
      codigo: "lenguaje",
      motivo: `El reto está en "${pregunta.data.lenguaje}".`,
    }
  }

  const tests = buscarTestsEnlazados(bloquesDeLaSeccion, bloqueId)
  if (!tests) {
    return {
      ok: false,
      codigo: "sin-tests",
      motivo: "El reto no tiene un bloque de pruebas enlazado.",
    }
  }
  if (tests.solucionReferencia.trim().length === 0) {
    return {
      ok: false,
      codigo: "sin-solucion",
      motivo: "El reto no tiene solución de referencia escrita.",
    }
  }

  return {
    ok: true,
    reto: {
      lenguaje: lenguaje.data,
      solucionReferencia: tests.solucionReferencia,
      tests: tests.tests,
      tiempoLimiteSeg: pregunta.data.tiempoLimiteSeg,
    },
  }
}

function buscarTestsEnlazados(bloques: readonly BloqueDetalleResponse[], bloqueId: string) {
  for (const bloque of bloques) {
    if (bloque.tipo !== "CODIGO_TESTS") {
      continue
    }
    const parsed = contenidoCodigoTestsSchema.safeParse(bloque.contenido)
    if (parsed.success && parsed.data.codigoPreguntasId === bloqueId) {
      return parsed.data
    }
  }
  return null
}
