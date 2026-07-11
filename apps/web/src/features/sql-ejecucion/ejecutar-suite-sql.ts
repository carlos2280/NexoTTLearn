import { PGlite } from "@electric-sql/pglite"
import type { TestSql } from "@nexott-learn/shared-types"
import { filasCoinciden, normalizarResultadoPglite } from "./comparar-filas"
import type {
  ConjuntoFilas,
  InputEjecucionSql,
  ResultadoEjecucionSql,
  ResultadoTestSqlUI,
} from "./types"

const CONJUNTO_VACIO: ConjuntoFilas = { columnas: [], filas: [] }

class TimeoutError extends Error {}

type EjecucionConsulta =
  | { readonly ok: true; readonly conjunto: ConjuntoFilas }
  | { readonly ok: false; readonly estado: "timeout" | "fallo"; readonly error: string }

/**
 * Ejecuta la consulta del participante contra cada test en PGlite y devuelve
 * el detalle por test + los conteos. Por cada test se levantan DOS bases
 * frescas (una para la consulta de referencia, otra para la del alumno) para
 * que una consulta que muta datos (INSERT/UPDATE/DELETE) no contamine a la
 * otra. La verificación compara los conjuntos de filas.
 */
export async function ejecutarSuiteSql(input: InputEjecucionSql): Promise<ResultadoEjecucionSql> {
  const resultados: ResultadoTestSqlUI[] = []
  let testsPasados = 0
  for (const test of input.tests) {
    const resultado = await ejecutarTest(input, test)
    if (resultado.paso) {
      testsPasados += 1
    }
    resultados.push(resultado)
  }
  return { resultados, testsPasados, testsTotales: input.tests.length }
}

async function ejecutarTest(input: InputEjecucionSql, test: TestSql): Promise<ResultadoTestSqlUI> {
  const semilla =
    test.esquemaSemilla.trim().length > 0 ? test.esquemaSemilla : input.esquemaSemillaEjercicio
  const timeoutMs = input.tiempoLimiteSeg * 1000
  const inicio = Date.now()

  const referencia = await ejecutarConsulta(semilla, test.consultaReferencia, timeoutMs)
  if (!referencia.ok) {
    return baseTest(test, {
      paso: false,
      estado: "fallo",
      obtenido: CONJUNTO_VACIO,
      esperado: CONJUNTO_VACIO,
      error: `La consulta de referencia falló (revisa el contenido del ejercicio): ${referencia.error}`,
      duracionMs: Date.now() - inicio,
    })
  }

  const alumno = await ejecutarConsulta(semilla, input.consulta, timeoutMs)
  if (!alumno.ok) {
    return baseTest(test, {
      paso: false,
      estado: alumno.estado,
      obtenido: CONJUNTO_VACIO,
      esperado: referencia.conjunto,
      error: alumno.error,
      duracionMs: Date.now() - inicio,
    })
  }

  return baseTest(test, {
    paso: filasCoinciden(alumno.conjunto, referencia.conjunto, test.ordenImporta),
    estado: "ok",
    obtenido: alumno.conjunto,
    esperado: referencia.conjunto,
    error: "",
    duracionMs: Date.now() - inicio,
  })
}

async function ejecutarConsulta(
  semilla: string,
  sql: string,
  timeoutMs: number,
): Promise<EjecucionConsulta> {
  const db = new PGlite()
  try {
    if (semilla.trim().length > 0) {
      await db.exec(semilla)
    }
    const res = await conTimeout(db.query<Record<string, unknown>>(sql), timeoutMs)
    return { ok: true, conjunto: normalizarResultadoPglite(res) }
  } catch (err) {
    if (err instanceof TimeoutError) {
      return { ok: false, estado: "timeout", error: `La consulta superó ${timeoutMs} ms.` }
    }
    return { ok: false, estado: "fallo", error: err instanceof Error ? err.message : String(err) }
  } finally {
    await db.close()
  }
}

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new TimeoutError("timeout")), ms)
    promesa.then(
      (valor) => {
        clearTimeout(id)
        resolve(valor)
      },
      (err) => {
        clearTimeout(id)
        reject(err instanceof Error ? err : new Error(String(err)))
      },
    )
  })
}

function baseTest(
  test: TestSql,
  campos: Omit<ResultadoTestSqlUI, "testId" | "descripcion" | "visible">,
): ResultadoTestSqlUI {
  return { testId: test.id, descripcion: test.descripcion, visible: test.visible, ...campos }
}
