import {
  type EstadoGit,
  type ResultadoGit,
  branch,
  checkout,
  commit,
  log,
  merge,
  status,
} from "./motor-git"
import { type ComandoGit, parsearComando } from "./parsear-comando"

/** Aplica un comando ya parseado (no-error) sobre el estado y devuelve el resultado. */
function aplicar(estado: EstadoGit, cmd: Exclude<ComandoGit, { tipo: "error" }>): ResultadoGit {
  switch (cmd.tipo) {
    case "commit":
      return commit(estado, cmd.mensaje)
    case "branch":
      return branch(estado, cmd.nombre)
    case "checkout":
      return checkout(estado, cmd.nombre, cmd.crear)
    case "merge":
      return merge(estado, cmd.nombre)
    case "log":
      return log(estado)
    default:
      return status(estado)
  }
}

export interface EjecucionGit {
  readonly estado: EstadoGit
  readonly salida: string
  readonly error: boolean
  /** `true` si la línea era un comando `git` reconocido (aunque fallara al aplicarse). */
  readonly reconocido: boolean
}

/**
 * Parsea y aplica una línea del terminal sobre el estado. Puro y testeable: no
 * toca React ni el DOM. El componente decide qué hacer con el resultado.
 */
export function ejecutarComando(estado: EstadoGit, linea: string): EjecucionGit {
  const cmd = parsearComando(linea)
  if (cmd.tipo === "error") {
    return { estado, salida: cmd.mensaje, error: true, reconocido: false }
  }
  const r = aplicar(estado, cmd)
  return { estado: r.estado, salida: r.salida, error: r.error, reconocido: true }
}
