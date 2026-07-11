/** Tope de commits mínimos que admite el contrato `objetivoGitSchema`. */
const COMMITS_MAX = 100

/**
 * Estado de formulario del objetivo declarativo de git. Se guarda "friendly"
 * (strings editables, array de ramas) y `construirContenidoGit` lo traduce al
 * contrato `objetivoGitSchema` omitiendo los campos vacíos.
 */
export interface BorradorObjetivo {
  readonly ramaActiva: string
  readonly ramasExisten: readonly string[]
  readonly hayMergeEnMain: boolean
  readonly commitsMinimos: string
}

/**
 * Estado de formulario completo del editor de GIT_EJERCICIO. Se mantiene
 * "friendly" (strings editables) y se traduce al contrato `contenidoGitEjercicioSchema`
 * con `construirContenidoGit`, que omite los campos vacíos del objetivo.
 */
export interface BorradorGit {
  readonly enunciado: string
  readonly pista: string
  readonly objetivo: BorradorObjetivo
}

export function leerInicialGit(contenido: Record<string, unknown> | null): BorradorGit {
  const objetivoRaw =
    typeof contenido?.objetivo === "object" && contenido.objetivo !== null
      ? (contenido.objetivo as Record<string, unknown>)
      : {}
  return {
    enunciado: typeof contenido?.enunciado === "string" ? contenido.enunciado : "",
    pista: typeof contenido?.pista === "string" ? contenido.pista : "",
    objetivo: {
      ramaActiva: typeof objetivoRaw.ramaActiva === "string" ? objetivoRaw.ramaActiva : "",
      ramasExisten: Array.isArray(objetivoRaw.ramasExisten)
        ? objetivoRaw.ramasExisten.filter((r): r is string => typeof r === "string")
        : [],
      hayMergeEnMain: objetivoRaw.hayMergeEnMain === true,
      commitsMinimos:
        typeof objetivoRaw.commitsMinimos === "number" ? String(objetivoRaw.commitsMinimos) : "",
    },
  }
}

/**
 * Traduce el borrador del objetivo al contrato `objetivoGitSchema`: omite los
 * campos vacíos (rama sin nombre, sin ramas, merge apagado, commits 0/vacío)
 * porque el evaluador solo comprueba lo presente (AND de criterios) y el schema
 * es `.strict()`.
 */
function construirObjetivo(o: BorradorObjetivo): Record<string, unknown> {
  const objetivo: Record<string, unknown> = {}
  const ramaActiva = o.ramaActiva.trim()
  if (ramaActiva) {
    objetivo.ramaActiva = ramaActiva
  }
  const ramas = o.ramasExisten.map((r) => r.trim()).filter(Boolean)
  if (ramas.length > 0) {
    objetivo.ramasExisten = ramas
  }
  if (o.hayMergeEnMain) {
    objetivo.hayMergeEnMain = true
  }
  const commits = Number.parseInt(o.commitsMinimos, 10)
  if (Number.isFinite(commits) && commits > 0) {
    // Acota al máximo del contrato: sin esto, teclear/pegar >100 haría fallar
    // el safeParse del backend y dejaría el auto-guardado en "error" silencioso.
    objetivo.commitsMinimos = Math.min(commits, COMMITS_MAX)
  }
  return objetivo
}

export function construirContenidoGit(borrador: BorradorGit): Record<string, unknown> {
  return {
    enunciado: borrador.enunciado,
    objetivo: construirObjetivo(borrador.objetivo),
    pista: borrador.pista,
  }
}
