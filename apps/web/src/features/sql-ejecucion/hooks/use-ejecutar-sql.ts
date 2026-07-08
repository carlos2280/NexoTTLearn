import { type UseMutationResult, useMutation } from "@tanstack/react-query"
import { ejecutarSuiteSql } from "../ejecutar-suite-sql"
import type { InputEjecucionSql, ResultadoEjecucionSql } from "../types"

/**
 * Hook expuesto al componente que renderiza un `SQL_EJERCICIO`. Es una
 * `mutation` (no una query): el participante dispara la ejecución con un
 * botón. Un fallo al cargar PGlite llega como `error` de la mutation; los
 * fallos de la propia consulta del alumno (SQL inválido, timeout) viven en
 * `data` como resultados de test con `paso=false`.
 */
export function useEjecutarSql(): UseMutationResult<
  ResultadoEjecucionSql,
  Error,
  InputEjecucionSql
> {
  return useMutation<ResultadoEjecucionSql, Error, InputEjecucionSql>({
    mutationFn: (input) => ejecutarSuiteSql(input),
  })
}
