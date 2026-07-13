import {
  type BloqueDetalleResponse,
  type ContenidoSqlTests,
  contenidoSqlTestsSchema,
} from "@nexott-learn/shared-types"

/**
 * Recorre los bloques de la sección, parsea el contenido de cada `SQL_TESTS`
 * y devuelve un Map indexado por `sqlEjercicioId` para que el render del
 * bloque `SQL_EJERCICIO` pueda ejecutar la suite en el navegador (PGlite).
 * Espejo de `indexarTestsPorPregunta` para CODIGO_TESTS.
 */
export function indexarSqlTestsPorEjercicio(
  bloques: readonly BloqueDetalleResponse[],
): ReadonlyMap<string, ContenidoSqlTests> {
  const indice = new Map<string, ContenidoSqlTests>()
  for (const bloque of bloques) {
    if (bloque.tipo !== "SQL_TESTS") {
      continue
    }
    const parsed = contenidoSqlTestsSchema.safeParse(bloque.contenido)
    if (!parsed.success) {
      continue
    }
    indice.set(parsed.data.sqlEjercicioId, parsed.data)
  }
  return indice
}
