// biome-ignore lint/performance/noBarrelFile: punto de entrada estable del feature `codigo-ejecucion`; lo importan multiples pages. Eliminarlo forzaria a actualizar imports en toda la app sin beneficio real de tree-shaking.
export { useEjecutarCodigo } from "./hooks/use-ejecutar-codigo"
export type {
  InputEjecucionSuite,
  ResultadoEjecucionSuite,
  ResultadoTestUI,
} from "./types"
