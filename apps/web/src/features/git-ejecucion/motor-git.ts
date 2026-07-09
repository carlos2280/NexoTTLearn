/**
 * Motor de git en memoria para el bloque `GIT_EJERCICIO` del curso inmersivo.
 * Estado PURO y determinista: sin efectos, sin fechas, sin azar — el id de cada
 * commit se deriva de su contenido, así los tests son estables. Cubre el flujo
 * troncal que enseña el curso: branch → commit → merge de vuelta a main.
 *
 * Reusa el simulador nacido en el spike del aula (`feat/ide-inmerso-faena`),
 * ahora como feature de primera clase consumible por un bloque del importador.
 */

export interface Commit {
  readonly id: string
  readonly mensaje: string
  /** Ids de los padres: 1 en un commit normal, 2 en un merge, 0 en la raíz. */
  readonly padres: readonly string[]
  /** Rama en la que nació el commit (para colorear el grafo). */
  readonly rama: string
}

export interface EstadoGit {
  readonly commits: readonly Commit[]
  /** Nombre de rama → id del commit al que apunta (su "tip"). */
  readonly ramas: Readonly<Record<string, string>>
  /** Rama activa (HEAD). */
  readonly head: string
}

export interface ResultadoGit {
  readonly estado: EstadoGit
  readonly salida: string
  readonly error: boolean
}

export const RAMA_BASE = "main"

/** Hash corto determinista (djb2) → 7 hex, imita un sha de git sin usar azar. */
function sha(semilla: string): string {
  let h = 5381
  for (let i = 0; i < semilla.length; i++) {
    h = ((h << 5) + h + semilla.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(7, "0").slice(0, 7)
}

export function estadoInicial(): EstadoGit {
  const raiz: Commit = {
    id: sha("root"),
    mensaje: "Inicializa el panel de la faena",
    padres: [],
    rama: RAMA_BASE,
  }
  return { commits: [raiz], ramas: { [RAMA_BASE]: raiz.id }, head: RAMA_BASE }
}

function ok(estado: EstadoGit, salida: string): ResultadoGit {
  return { estado, salida, error: false }
}
function fallo(estado: EstadoGit, salida: string): ResultadoGit {
  return { estado, salida, error: true }
}

/** Id del commit al que apunta la rama activa. */
export function tip(estado: EstadoGit): string {
  return estado.ramas[estado.head] ?? ""
}

export function commit(estado: EstadoGit, mensaje: string): ResultadoGit {
  if (!mensaje.trim()) {
    return fallo(estado, 'Falta el mensaje del commit (usa -m "…").')
  }
  const padre = tip(estado)
  const nuevo: Commit = {
    id: sha(`${padre}:${mensaje}:${estado.commits.length}`),
    mensaje,
    padres: [padre],
    rama: estado.head,
  }
  return ok(
    {
      commits: [...estado.commits, nuevo],
      ramas: { ...estado.ramas, [estado.head]: nuevo.id },
      head: estado.head,
    },
    `[${estado.head} ${nuevo.id}] ${mensaje}`,
  )
}

export function branch(estado: EstadoGit, nombre: string): ResultadoGit {
  if (!nombre) {
    return fallo(estado, "Indica el nombre de la rama.")
  }
  if (estado.ramas[nombre]) {
    return fallo(estado, `La rama '${nombre}' ya existe.`)
  }
  return ok(
    { ...estado, ramas: { ...estado.ramas, [nombre]: tip(estado) } },
    `Rama '${nombre}' creada sobre ${tip(estado)}.`,
  )
}

export function checkout(estado: EstadoGit, nombre: string, crear: boolean): ResultadoGit {
  if (crear) {
    if (estado.ramas[nombre]) {
      return fallo(estado, `La rama '${nombre}' ya existe.`)
    }
    const ramas = { ...estado.ramas, [nombre]: tip(estado) }
    return ok({ ...estado, ramas, head: nombre }, `Cambiado a nueva rama '${nombre}'.`)
  }
  if (!estado.ramas[nombre]) {
    return fallo(estado, `La rama '${nombre}' no existe (créala con -b).`)
  }
  return ok({ ...estado, head: nombre }, `Cambiado a la rama '${nombre}'.`)
}

export function merge(estado: EstadoGit, nombre: string): ResultadoGit {
  const otra = estado.ramas[nombre]
  if (!otra) {
    return fallo(estado, `La rama '${nombre}' no existe.`)
  }
  if (nombre === estado.head) {
    return fallo(estado, "No puedes mergear una rama consigo misma.")
  }
  const actual = tip(estado)
  if (actual === otra) {
    return ok(estado, "Ya está al día, no hay nada que integrar.")
  }
  const nuevo: Commit = {
    id: sha(`${actual}+${otra}:merge`),
    mensaje: `Merge de la rama '${nombre}' en '${estado.head}'`,
    padres: [actual, otra],
    rama: estado.head,
  }
  return ok(
    {
      commits: [...estado.commits, nuevo],
      ramas: { ...estado.ramas, [estado.head]: nuevo.id },
      head: estado.head,
    },
    `Merge de '${nombre}' → '${estado.head}' (${nuevo.id}).`,
  )
}

/** Commits alcanzables desde un tip, en orden cronológico (más nuevo primero). */
export function alcanzablesDesde(estado: EstadoGit, desde: string): readonly Commit[] {
  const porId = new Map(estado.commits.map((c) => [c.id, c]))
  const vistos = new Set<string>()
  const pila = [desde]
  while (pila.length > 0) {
    const id = pila.pop()
    if (!id || vistos.has(id)) {
      continue
    }
    vistos.add(id)
    const c = porId.get(id)
    if (c) {
      pila.push(...c.padres)
    }
  }
  return estado.commits.filter((c) => vistos.has(c.id)).reverse()
}

export function log(estado: EstadoGit): ResultadoGit {
  const orden = alcanzablesDesde(estado, tip(estado))
  const texto = orden.map((c) => `${c.id} ${c.mensaje}`).join("\n")
  return ok(estado, texto || "Sin commits todavía.")
}

export function status(estado: EstadoGit): ResultadoGit {
  const otras = Object.keys(estado.ramas).filter((r) => r !== estado.head)
  const detalle = otras.length > 0 ? `\nOtras ramas: ${otras.join(", ")}` : ""
  return ok(estado, `En la rama ${estado.head}\nÁrbol de trabajo limpio.${detalle}`)
}

/**
 * Objetivo "clásico" del flujo troncal: rama → commit → merge de vuelta a main.
 * Se conserva como conveniencia y ejemplo; el bloque del curso usa el objetivo
 * declarativo (`objetivo-git.ts`), que generaliza esta idea.
 */
export function misionCumplida(estado: EstadoGit): boolean {
  if (estado.head !== RAMA_BASE) {
    return false
  }
  return alcanzablesDesde(estado, estado.ramas[RAMA_BASE] ?? "").some((c) => c.padres.length === 2)
}
