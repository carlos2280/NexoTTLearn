/**
 * Validación de la URL de repositorio que entrega el participante — primera
 * línea de defensa anti-SSRF (OWASP A10). El repo lo clona el backend, así que
 * una URL arbitraria podría apuntar a la red interna. Reglas:
 *
 *  - Solo `https:` (nada de `http:`, `ssh:`, `file:`, `git:`).
 *  - Host en lista blanca (GitHub / GitLab y sus `www`).
 *  - Sin credenciales embebidas (`user:pass@host`).
 *  - Puerto por defecto (vacío o 443) — cierra el pivot a puertos internos.
 *  - Path con forma `/owner/repo` (al menos dos segmentos no vacíos).
 *
 * Es una función pura (sin Nest): devuelve un resultado discriminado para que
 * el service la traduzca a la excepción HTTP correspondiente y para testear sin
 * levantar el contenedor.
 */

// Solo los hosts apex: GitHub/GitLab responden 301 en `www.*` y el cliente de
// isomorphic-git no sigue redirects, así que `www.*` nunca clonaría.
const HOSTS_PERMITIDOS: ReadonlySet<string> = new Set(["github.com", "gitlab.com"])

const PUERTOS_PERMITIDOS: ReadonlySet<string> = new Set(["", "443"])

const SUFIJO_GIT = /\.git$/

export type ResultadoValidacionRepo =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly motivo: string }

export function validarRepoUrl(entrada: string): ResultadoValidacionRepo {
  let url: URL
  try {
    url = new URL(entrada)
  } catch {
    return { ok: false, motivo: "La URL del repositorio no es válida." }
  }

  if (url.protocol !== "https:") {
    return { ok: false, motivo: "El repositorio debe usar https." }
  }
  if (url.username.length > 0 || url.password.length > 0) {
    return { ok: false, motivo: "La URL no puede incluir credenciales." }
  }
  if (!PUERTOS_PERMITIDOS.has(url.port)) {
    return { ok: false, motivo: "La URL no puede especificar un puerto." }
  }
  if (!HOSTS_PERMITIDOS.has(url.hostname.toLowerCase())) {
    return { ok: false, motivo: "Solo se aceptan repositorios de GitHub o GitLab." }
  }

  const segmentos = url.pathname.split("/").filter((s) => s.length > 0)
  const [owner, repoNombre] = segmentos
  if (owner === undefined || repoNombre === undefined) {
    return { ok: false, motivo: "La URL debe apuntar a un repositorio (owner/repo)." }
  }

  // Normaliza: descarta query/hash y se queda con `https://host/owner/repo`.
  const repo = repoNombre.replace(SUFIJO_GIT, "")
  return { ok: true, url: `https://${url.hostname}/${owner}/${repo}` }
}
