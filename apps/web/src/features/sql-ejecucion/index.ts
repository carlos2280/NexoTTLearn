// biome-ignore lint/performance/noBarrelFile: punto de entrada estable del feature `sql-ejecucion`; lo importa el bloque SQL del lector. Espejo de `codigo-ejecucion`.
export { useEjecutarSql } from "./hooks/use-ejecutar-sql"
export { ejecutarSuiteSql } from "./ejecutar-suite-sql"
export type {
  ConjuntoFilas,
  InputEjecucionSql,
  ResultadoEjecucionSql,
  ResultadoTestSqlUI,
} from "./types"
