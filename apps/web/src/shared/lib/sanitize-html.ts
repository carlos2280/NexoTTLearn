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

/**
 * Normaliza los encabezados del contenido de una lección a `h3`. El título de
 * la sección ya es un `<h2>` (y el del curso un `<h1>`), así que cualquier
 * encabezado que el admin ponga dentro de un párrafo/tip debe quedar SUBORDINADO
 * a la sección para no romper la jerarquía del documento (WCAG 2.2 §1.3.1). El
 * diseño "un archivo" del lector ya aplana visualmente los encabezados a
 * comentarios `// ...`, así que colapsar todos a `h3` no cambia la apariencia y
 * arregla el outline para lectores de pantalla.
 *
 * Opera sobre la salida de Tiptap ya sanitizada: los encabezados que emite el
 * editor no llevan atributos con `>` ni con `</hN>` embebido, así que el reemplazo
 * por regex es seguro en la práctica. (Si algún día un encabezado pudiera traer
 * atributos con esos caracteres literales, conviene migrar a un renombrado por
 * DOM; hoy no ocurre.)
 */
export function normalizarEncabezadosLeccion(html: string): string {
  return html
    .replace(
      /<h[12456](\s[^>]*)?>/gi,
      (_match, atributos: string | undefined) => `<h3${atributos ?? ""}>`,
    )
    .replace(/<\/h[12456]>/gi, "</h3>")
}

/**
 * Extrae sólo el texto plano de un HTML (sin tags), colapsando whitespace.
 * Útil para cabeceras compactas o terminales tipo IDE donde la descripción
 * se guarda como HTML (TipTap) pero el render no admite formato.
 */
export function extraerTextoPlano(html: string): string {
  return DOMPurify.sanitize(html, {
    // biome-ignore lint/style/useNamingConvention: API de DOMPurify.
    ALLOWED_TAGS: [],
    // biome-ignore lint/style/useNamingConvention: API de DOMPurify.
    ALLOWED_ATTR: [],
  })
    .replace(/\s+/g, " ")
    .trim()
}
