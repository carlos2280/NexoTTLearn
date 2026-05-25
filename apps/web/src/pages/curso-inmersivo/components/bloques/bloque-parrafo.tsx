import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import { contenidoParrafoSchema } from "@nexott-learn/shared-types"

interface BloqueParrafoProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque PARRAFO. El admin lo edita con Tiptap y persiste HTML
 * serializado; aquí lo sanitizamos y lo inyectamos con
 * `dangerouslySetInnerHTML`. Las clases `prose-*` del wrapper aplican
 * tipografía editorial NexoTT al contenido.
 */
export function BloqueParrafo({ contenido }: BloqueParrafoProps) {
  const parsed = contenidoParrafoSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  const html = sanitizarHtml(parsed.data.html)
  if (html.trim().length === 0) {
    return null
  }
  return (
    <article
      className="tiptap max-w-prose text-body text-text-primary"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML producido por Tiptap del admin, sanitizado en sanitizarHtml.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
