import { z } from "zod"

/**
 * Shape esperado de `Bloque.contenido` (JSONB) cuando `tipo=SQL_EJERCICIO` y
 * `tipo=SQL_TESTS`. Espejo de CODIGO_PREGUNTAS / CODIGO_TESTS, pero el motor
 * ejecuta SQL sobre PGlite (Postgres en WASM) en el navegador y verifica por
 * **conjuntos de filas**, no por stdout de texto.
 *
 * Modelo:
 *  - `SQL_EJERCICIO` es el reto: enunciado + una `esquemaSemilla` visible
 *    (DDL + INSERTs) que el alumno explora mientras itera + una consulta
 *    inicial (esqueleto). Siempre auto-evaluable: exige un `SQL_TESTS` hermano.
 *  - `SQL_TESTS` aporta los casos. Cada test trae su propia semilla (para
 *    evitar respuestas hardcodeadas) y una `consultaReferencia`: el runner
 *    corre la consulta del alumno y la de referencia sobre la MISMA base y
 *    compara los conjuntos de filas. `SQL_TESTS` no es evaluable (auxiliar).
 *
 * Verificación (en el navegador): por cada test se crea una base PGlite fresca,
 * se aplica `esquemaSemilla` (la del test, o la del ejercicio si el test no
 * declara una), se corre la consulta del alumno → filas obtenidas, y la
 * `consultaReferencia` → filas esperadas. Se comparan como lista ordenada si
 * `ordenImporta` (SELECT con ORDER BY), o como multiconjunto en caso contrario.
 * El backend NO ejecuta SQL: recuenta la nota desde los `paso` reportados,
 * igual que en CODIGO_PREGUNTAS.
 */

export const contenidoSqlEjercicioSchema = z
  .object({
    enunciado: z.string().min(1).max(20_000),
    esquemaSemilla: z.string().max(50_000).default(""),
    consultaInicial: z.string().max(50_000).default(""),
    tiempoLimiteSeg: z.number().int().min(1).max(120).default(30),
  })
  .strict()
export type ContenidoSqlEjercicio = z.infer<typeof contenidoSqlEjercicioSchema>

export const testSqlSchema = z
  .object({
    id: z.string().min(1),
    descripcion: z.string().max(500).default(""),
    visible: z.boolean().default(true),
    /** Semilla propia del test. Si vacía, el runner usa la del ejercicio. */
    esquemaSemilla: z.string().max(50_000).default(""),
    /** SQL correcta: su resultado define las filas esperadas. */
    consultaReferencia: z.string().min(1).max(50_000),
    /** `true` compara filas en orden (SELECT con ORDER BY); si no, multiconjunto. */
    ordenImporta: z.boolean().default(false),
  })
  .strict()
export type TestSql = z.infer<typeof testSqlSchema>

export const contenidoSqlTestsSchema = z
  .object({
    sqlEjercicioId: z.string().uuid(),
    tests: z.array(testSqlSchema).min(1).max(20),
  })
  .strict()
export type ContenidoSqlTests = z.infer<typeof contenidoSqlTestsSchema>
