import type { TestSqlUnit } from "../sql-tests/fila-test-sql"

/**
 * Construye el `contenido` del bloque SQL_TESTS a persistir, o `null` para
 * saltar el guardado. `consultaReferencia` exige `min(1)` en el contrato: un
 * test recién añadido la trae vacía, y el bloque se guarda como un solo blob,
 * así que un único test incompleto haría fallar el PATCH del bloque entero con
 * un 400. Devolvemos `null` mientras algún test esté incompleto (el hook de
 * auto-guardado lo interpreta como "sin cambios que persistir").
 */
export function construirContenidoTestsSql(
  sqlEjercicioId: string,
  tests: readonly TestSqlUnit[],
): Record<string, unknown> | null {
  const hayIncompleto = tests.some((t) => t.consultaReferencia.trim().length === 0)
  if (hayIncompleto) {
    return null
  }
  return { sqlEjercicioId, tests: [...tests] }
}
