/**
 * Parser mínimo de la línea de comandos git del bloque `GIT_EJERCICIO`. Reconoce
 * el subconjunto que enseña el curso: commit, branch, checkout/switch, merge,
 * log, status. Devuelve un comando discriminado (o un error legible) — sin
 * ejecutar nada.
 */

const ESPACIOS = /\s+/

export type ComandoGit =
  | { readonly tipo: "commit"; readonly mensaje: string }
  | { readonly tipo: "branch"; readonly nombre: string }
  | { readonly tipo: "checkout"; readonly nombre: string; readonly crear: boolean }
  | { readonly tipo: "merge"; readonly nombre: string }
  | { readonly tipo: "log" }
  | { readonly tipo: "status" }
  | { readonly tipo: "error"; readonly mensaje: string }

function quitarComillas(texto: string): string {
  const t = texto.trim()
  const entreComillas =
    (t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))
  return entreComillas ? t.slice(1, -1) : t
}

function parsearCommit(resto: readonly string[]): ComandoGit {
  const i = resto.indexOf("-m")
  if (i === -1 || !resto[i + 1]) {
    return { tipo: "error", mensaje: 'Usa: git commit -m "tu mensaje"' }
  }
  return { tipo: "commit", mensaje: quitarComillas(resto.slice(i + 1).join(" ")) }
}

/** checkout -b y switch -c comparten forma: [flag] <rama>. */
function parsearCambioRama(resto: readonly string[], flagCrear: string): ComandoGit {
  const crear = resto[0] === flagCrear
  const nombre = crear ? resto[1] : resto[0]
  return nombre
    ? { tipo: "checkout", nombre, crear }
    : { tipo: "error", mensaje: "Usa: git checkout -b <rama> (o git switch -c <rama>)" }
}

function parsearBranch(resto: readonly string[]): ComandoGit {
  return resto[0]
    ? { tipo: "branch", nombre: resto[0] }
    : { tipo: "error", mensaje: "Usa: git branch <nombre>" }
}

function parsearMerge(resto: readonly string[]): ComandoGit {
  return resto[0]
    ? { tipo: "merge", nombre: resto[0] }
    : { tipo: "error", mensaje: "Usa: git merge <rama>" }
}

export function parsearComando(linea: string): ComandoGit {
  const partes = linea.trim().split(ESPACIOS).filter(Boolean)
  if (partes.length === 0) {
    return { tipo: "error", mensaje: "" }
  }
  if (partes[0] !== "git") {
    return { tipo: "error", mensaje: `Solo comandos 'git' aquí. Escribiste: ${partes[0]}` }
  }
  const resto = partes.slice(2)
  switch (partes[1]) {
    case "commit":
      return parsearCommit(resto)
    case "branch":
      return parsearBranch(resto)
    case "checkout":
      return parsearCambioRama(resto, "-b")
    case "switch":
      return parsearCambioRama(resto, "-c")
    case "merge":
      return parsearMerge(resto)
    case "log":
      return { tipo: "log" }
    case "status":
      return { tipo: "status" }
    default:
      return {
        tipo: "error",
        mensaje: `Subcomando no soportado en el ejercicio: git ${partes[1] ?? ""}`,
      }
  }
}
