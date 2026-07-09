import type { ObjetivoGit } from "@nexott-learn/shared-types"
import { type EstadoGit, RAMA_BASE, alcanzablesDesde } from "./motor-git"

/**
 * Evalúa un objetivo declarativo contra el estado final del repo simulado.
 * Todos los campos presentes deben cumplirse (AND). Un objetivo vacío se
 * considera cumplido trivialmente; en la práctica siempre trae al menos un
 * criterio. Es la base del "logrado" en el cliente y del futuro modo evaluable.
 */
export function objetivoCumplido(estado: EstadoGit, objetivo: ObjetivoGit): boolean {
  if (objetivo.ramaActiva !== undefined && estado.head !== objetivo.ramaActiva) {
    return false
  }
  if (objetivo.ramasExisten?.some((r) => !(r in estado.ramas))) {
    return false
  }
  if (objetivo.hayMergeEnMain === true && !existeMergeEnMain(estado)) {
    return false
  }
  if (objetivo.commitsMinimos !== undefined && commitsSinRaiz(estado) < objetivo.commitsMinimos) {
    return false
  }
  return true
}

/** ¿Hay un commit de merge (2 padres) alcanzable desde main? */
function existeMergeEnMain(estado: EstadoGit): boolean {
  return alcanzablesDesde(estado, estado.ramas[RAMA_BASE] ?? "").some((c) => c.padres.length === 2)
}

/** Commits creados por el alumno (todos menos el commit raíz, que no tiene padres). */
function commitsSinRaiz(estado: EstadoGit): number {
  return estado.commits.filter((c) => c.padres.length > 0).length
}
