import type { ProveedorVideo } from "@nexott-learn/shared-types"

export interface DetectedProvider {
  readonly proveedor: ProveedorVideo
  readonly videoId: string | null
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
])
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"])

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/
const VIMEO_ID_RE = /^\d{6,12}$/
const LEADING_SLASHES_RE = /^\/+/

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

function extractYoutubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(LEADING_SLASHES_RE, "").split("/")[0] ?? ""
    return YOUTUBE_ID_RE.test(id) ? id : null
  }
  const v = url.searchParams.get("v")
  if (v && YOUTUBE_ID_RE.test(v)) {
    return v
  }
  const segments = url.pathname.split("/").filter(Boolean)
  const head = segments[0]
  const next = segments[1]
  if (next && (head === "embed" || head === "shorts")) {
    return YOUTUBE_ID_RE.test(next) ? next : null
  }
  return null
}

function extractVimeoId(url: URL): string | null {
  const segments = url.pathname.split("/").filter(Boolean)
  const head = segments[0]
  const next = segments[1]
  if (url.hostname === "player.vimeo.com" && head === "video" && next) {
    return VIMEO_ID_RE.test(next) ? next : null
  }
  if (head && VIMEO_ID_RE.test(head)) {
    return head
  }
  return null
}

// Detecta el proveedor de video a partir de la URL pegada por el admin. Si
// reconoce un host de YouTube/Vimeo extrae el id (lo usa la preview con
// /embed/{id}). Para cualquier otra URL devuelve "interno" — el back permite
// servir un mp4 propio y la preview cae a <video src={url}>.
export function detectVideoProvider(url: string): DetectedProvider {
  const trimmed = url.trim()
  if (trimmed.length === 0) {
    return { proveedor: "interno", videoId: null }
  }

  const parsed = parseUrl(trimmed)
  if (!parsed) {
    return { proveedor: "interno", videoId: null }
  }

  const host = parsed.hostname.toLowerCase()
  if (YOUTUBE_HOSTS.has(host)) {
    return { proveedor: "youtube", videoId: extractYoutubeId(parsed) }
  }
  if (VIMEO_HOSTS.has(host)) {
    return { proveedor: "vimeo", videoId: extractVimeoId(parsed) }
  }
  return { proveedor: "interno", videoId: null }
}
