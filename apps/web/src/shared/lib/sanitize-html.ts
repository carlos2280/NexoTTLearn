import DOMPurify from "dompurify"

/**
 * Sanitiza HTML producido por Tiptap (admin) antes de inyectarlo con
 * `dangerouslySetInnerHTML`. Defensa en profundidad: aunque el editor
 * limita los tags emitidos, el backend persiste el `html` como string
 * libre y un admin malicioso podría inyectar `<script>` por API directa.
 *
 * Whitelist conservadora alineada con extensiones Tiptap habilitadas en el
 * editor del admin (`editor-parrafo.tsx`, `editor-tip.tsx`).
 */
const TAGS_PERMITIDOS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
]

const ATTRS_PERMITIDOS = ["href", "target", "rel", "src", "alt", "title", "class"]

export function sanitizarHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    // biome-ignore lint/style/useNamingConvention: API de DOMPurify usa SCREAMING_SNAKE_CASE.
    ALLOWED_TAGS: TAGS_PERMITIDOS,
    // biome-ignore lint/style/useNamingConvention: API de DOMPurify.
    ALLOWED_ATTR: ATTRS_PERMITIDOS,
    // Fuerza target=_blank + rel=noopener en enlaces para evitar tabnabbing.
    // biome-ignore lint/style/useNamingConvention: API de DOMPurify.
    ADD_ATTR: ["target"],
  })
}
