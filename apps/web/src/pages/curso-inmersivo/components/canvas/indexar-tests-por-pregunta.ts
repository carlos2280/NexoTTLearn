import {
  type BloqueDetalleResponse,
  type ContenidoCodigoTests,
  contenidoCodigoTestsSchema,
} from "@nexott-learn/shared-types"

/**
 * Recorre los bloques de la sección, parsea el contenido de cada `CODIGO_TESTS`
 * y devuelve un Map indexado por `codigoPreguntasId` para que el render del
 * bloque `CODIGO_PREGUNTAS` pueda ejecutar los tests en el navegador.
 */
export function indexarTestsPorPregunta(
  bloques: readonly BloqueDetalleResponse[],
): ReadonlyMap<string, ContenidoCodigoTests> {
  const indice = new Map<string, ContenidoCodigoTests>()
  for (const bloque of bloques) {
    if (bloque.tipo !== "CODIGO_TESTS") {
      continue
    }
    const parsed = contenidoCodigoTestsSchema.safeParse(bloque.contenido)
    if (!parsed.success) {
      continue
    }
    indice.set(parsed.data.codigoPreguntasId, parsed.data)
  }
  return indice
}
