import { type ProveedorVideo, contenidoVideoSchema } from "@nexott-learn/shared-types"

interface BloqueVideoProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque VIDEO. Convierte la URL del proveedor a embed canónico:
 *  - YouTube: `/embed/<id>`
 *  - Vimeo: `player.vimeo.com/video/<id>`
 *  - Loom: `loom.com/embed/<id>`
 *  - otro: cae a `<video src>` nativo.
 *
 * Las notas opcionales del admin se muestran debajo del player.
 */
export function BloqueVideo({ contenido }: BloqueVideoProps) {
  const parsed = contenidoVideoSchema.safeParse(contenido)
  if (!parsed.success || parsed.data.url.trim().length === 0) {
    return null
  }
  const { url, proveedor, notas } = parsed.data

  return (
    <figure className="flex flex-col gap-3">
      <Reproductor url={url} proveedor={proveedor} />
      {notas.trim().length > 0 ? (
        <figcaption className="text-body-sm text-text-secondary">{notas}</figcaption>
      ) : null}
    </figure>
  )
}

function Reproductor({
  url,
  proveedor,
}: { readonly url: string; readonly proveedor: ProveedorVideo }) {
  const embed = embedUrl(url, proveedor)
  if (proveedor === "otro" && embed === null) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-black">
        {/* biome-ignore lint/a11y/useMediaCaption: el caption pedagógico ya va como figcaption fuera. */}
        <video controls={true} preload="metadata" className="aspect-video w-full">
          <source src={url} />
        </video>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-black">
      <iframe
        src={embed ?? url}
        title="Video del curso"
        className="aspect-video w-full"
        loading="lazy"
        // El servidor de la web fija `Referrer-Policy: no-referrer` (default de helmet); sin
        // Referer, el player de YouTube no valida el dominio y falla ("Error 153"). Este policy
        // por-iframe restaura el envío del origin y permite la reproducción.
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={true}
      />
    </div>
  )
}

const YOUTUBE_PATH_PREFIX = /^\/(embed\/|shorts\/)?/

/**
 * Convierte la URL del proveedor a su embed canónico. Devuelve `null` si no se
 * puede derivar el ID. `rel=0` limita las recomendaciones del final del video a
 * las del mismo canal (apropiado para un curso: no manda al alumno a videos ajenos).
 */
export function embedUrl(url: string, proveedor: ProveedorVideo): string | null {
  try {
    const u = new URL(url)
    if (proveedor === "youtube") {
      const id = u.searchParams.get("v") ?? u.pathname.replace(YOUTUBE_PATH_PREFIX, "") ?? ""
      if (id.length === 0) {
        return null
      }
      return `https://www.youtube.com/embed/${id}?rel=0`
    }
    if (proveedor === "vimeo") {
      const id = u.pathname.split("/").filter(Boolean).pop()
      if (!id) {
        return null
      }
      return `https://player.vimeo.com/video/${id}`
    }
    if (proveedor === "loom") {
      const partes = u.pathname.split("/").filter(Boolean)
      const id = partes[partes.length - 1]
      if (!id) {
        return null
      }
      return `https://www.loom.com/embed/${id}`
    }
    return null
  } catch {
    return null
  }
}
