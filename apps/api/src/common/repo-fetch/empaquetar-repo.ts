/**
 * Empaquetado del contenido de un repo clonado en un único texto para pasárselo
 * a la IA. Funciones puras (sin fs, sin Nest) para testear la política de
 * inclusión y los topes sin tocar disco. El recorrido real del árbol vive en el
 * `RepoFetchService`, que decide qué leer llamando a `debeIncluirArchivo` y
 * arma el bloque final con `empaquetarArchivos`.
 *
 * Los topes protegen contra repos enormes (coste de tokens / DoS): se corta por
 * número de archivos y por bytes totales, no solo por archivo.
 */

export interface LimitesEmpaquetado {
  readonly maxArchivos: number
  readonly maxBytesTotal: number
  readonly maxBytesArchivo: number
}

export const LIMITES_DEFECTO: LimitesEmpaquetado = {
  maxArchivos: 80,
  maxBytesTotal: 300_000,
  maxBytesArchivo: 60_000,
}

export interface ArchivoLeido {
  readonly ruta: string
  readonly contenido: string
  readonly bytes: number
}

export interface RepoEmpaquetado {
  readonly contenido: string
  readonly archivosIncluidos: number
  readonly bytesTotales: number
  readonly truncado: boolean
}

/** Directorios que nunca aportan valor de evaluación (ruido / peso). */
const DIRECTORIOS_IGNORADOS: ReadonlySet<string> = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  "vendor",
  ".turbo",
  ".cache",
])

/** Archivos concretos que ignoramos (lockfiles: enormes y sin valor). */
const ARCHIVOS_IGNORADOS: ReadonlySet<string> = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "composer.lock",
  "poetry.lock",
  "cargo.lock",
])

/** Extensiones de texto/código que sí incluimos. */
const EXTENSIONES_TEXTO: ReadonlySet<string> = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "vue",
  "svelte",
  "py",
  "rb",
  "php",
  "java",
  "kt",
  "go",
  "rs",
  "c",
  "h",
  "cpp",
  "hpp",
  "cs",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "md",
  "mdx",
  "txt",
  "sql",
  "prisma",
  "graphql",
  "gql",
  "sh",
  "bash",
  "dockerfile",
  // OJO: no incluir "env" — archivos `*.env` (production.env, staging.env)
  // suelen traer secretos y no deben viajar al proveedor de IA. `.env.example`
  // sí se acepta vía NOMBRES_TEXTO.
])

/** Nombres sin extensión que igual son texto útil. */
const NOMBRES_TEXTO: ReadonlySet<string> = new Set([
  "readme",
  "dockerfile",
  "makefile",
  "license",
  ".gitignore",
  ".env.example",
])

function nombreArchivo(ruta: string): string {
  const partes = ruta.split("/")
  return partes[partes.length - 1] ?? ruta
}

function extension(ruta: string): string {
  const nombre = nombreArchivo(ruta)
  const punto = nombre.lastIndexOf(".")
  if (punto <= 0) {
    return ""
  }
  return nombre.slice(punto + 1).toLowerCase()
}

/** True si algún segmento de la ruta es un directorio ignorado. */
export function esRutaIgnorada(rutaRelativa: string): boolean {
  const segmentos = rutaRelativa.split("/")
  return segmentos.some((seg) => DIRECTORIOS_IGNORADOS.has(seg))
}

/** True si el archivo es texto/código que queremos incluir. */
export function esArchivoTexto(rutaRelativa: string): boolean {
  const nombre = nombreArchivo(rutaRelativa).toLowerCase()
  if (NOMBRES_TEXTO.has(nombre)) {
    return true
  }
  return EXTENSIONES_TEXTO.has(extension(rutaRelativa))
}

/** Decide si un archivo entra al empaquetado (ruta + tipo + tamaño). */
export function debeIncluirArchivo(
  rutaRelativa: string,
  bytes: number,
  limites: LimitesEmpaquetado = LIMITES_DEFECTO,
): boolean {
  if (esRutaIgnorada(rutaRelativa)) {
    return false
  }
  if (ARCHIVOS_IGNORADOS.has(nombreArchivo(rutaRelativa).toLowerCase())) {
    return false
  }
  if (!esArchivoTexto(rutaRelativa)) {
    return false
  }
  return bytes > 0 && bytes <= limites.maxBytesArchivo
}

/**
 * Arma el texto final respetando los topes de nº de archivos y bytes totales.
 * Devuelve `truncado=true` si se dejó algún archivo fuera por los topes.
 */
export function empaquetarArchivos(
  archivos: readonly ArchivoLeido[],
  limites: LimitesEmpaquetado = LIMITES_DEFECTO,
): RepoEmpaquetado {
  const ordenados = [...archivos].sort((a, b) => a.ruta.localeCompare(b.ruta))
  const bloques: string[] = []
  let bytesTotales = 0
  let incluidos = 0
  let truncado = false

  for (const archivo of ordenados) {
    if (incluidos >= limites.maxArchivos || bytesTotales + archivo.bytes > limites.maxBytesTotal) {
      // `continue` (no `break`): un archivo grande temprano no debe descartar
      // archivos chicos posteriores que aún caben bajo el tope.
      truncado = true
      continue
    }
    bloques.push(`===== ${archivo.ruta} =====\n${archivo.contenido}`)
    bytesTotales += archivo.bytes
    incluidos += 1
  }

  return {
    contenido: bloques.join("\n\n"),
    archivosIncluidos: incluidos,
    bytesTotales,
    truncado,
  }
}
