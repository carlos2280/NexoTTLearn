// Helpers de slug para Curso.
// El slug se construye como `slugify(titulo)-slugify(empresa)-YYYYqN` y, en caso
// de colision, se le anaden sufijos `-2`, `-3`, ... hasta encontrar uno libre.
// modo-curso.md §3 (inspector ▾ Cliente y titulo) describe este formato.

export const SLUG_MAX_LEN = 160
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Eliminacion de diacriticos via NFD + filtro de combining marks Unicode
// (\p{M}). Aplicar antes del lowercase para que la N con tilde caiga a "n",
// la "U" con dieresis a "u", etc. El flag `u` evita el aviso de
// noMisleadingCharacterClass de biome al usar ranges de combining marks.
const COMBINING_MARKS_REGEX = /\p{M}/gu
const NO_ALNUM_REGEX = /[^a-z0-9]+/g
const TRIM_GUION_REGEX = /^-+|-+$/g

export function slugify(input: string): string {
  const sinTildes = input.normalize("NFD").replace(COMBINING_MARKS_REGEX, "")
  const minus = sinTildes.toLowerCase()
  const limpio = minus.replace(NO_ALNUM_REGEX, "-").replace(TRIM_GUION_REGEX, "")
  return limpio
}

export function esSlugValido(slug: string): boolean {
  return slug.length > 0 && slug.length <= SLUG_MAX_LEN && SLUG_REGEX.test(slug)
}

// `-YYYYqN`. Trimestre 1..4 segun mes. Sin dependencia externa: clavo el
// formato aqui para que el slug sea reproducible 1:1 desde el front si hace
// falta.
export function sufijoTrimestre(fecha: Date = new Date()): string {
  const anio = fecha.getUTCFullYear()
  const mes = fecha.getUTCMonth() // 0..11
  const trimestre = Math.floor(mes / 3) + 1
  return `${anio}q${trimestre}`
}

// Construye el slug base a partir de titulo + empresa + trimestre. El service
// lo trunca a SLUG_MAX_LEN si es necesario.
export function construirSlugBase(
  titulo: string,
  empresaCliente: string,
  fecha: Date = new Date(),
): string {
  const partes = [slugify(titulo), slugify(empresaCliente), sufijoTrimestre(fecha)].filter(
    (p) => p.length > 0,
  )
  const base = partes.join("-")
  if (base.length === 0) {
    // Fallback: si tanto titulo como empresa colapsaron a "", al menos
    // devolvemos el trimestre. Practicamente imposible (la validacion Zod
    // exige >=2 chars antes), pero defensivo.
    return sufijoTrimestre(fecha)
  }
  return base.slice(0, SLUG_MAX_LEN)
}

// Dado un slug base y un comprobador de existencia (sync), devuelve el primer
// slug libre intentando `-2`, `-3`, ... hasta `maxIntentos`.
export async function resolverSlugUnico(
  base: string,
  existeSlug: (slug: string) => Promise<boolean>,
  maxIntentos = 50,
): Promise<string> {
  if (!(await existeSlug(base))) {
    return base
  }
  for (let n = 2; n <= maxIntentos; n += 1) {
    const candidato = `${base}-${n}`.slice(0, SLUG_MAX_LEN)
    if (!(await existeSlug(candidato))) {
      return candidato
    }
  }
  // Si tras 50 colisiones no encontramos nada, anadimos timestamp como
  // ultimo recurso. Evita loops infinitos sin lanzar.
  return `${base}-${Date.now()}`.slice(0, SLUG_MAX_LEN)
}
