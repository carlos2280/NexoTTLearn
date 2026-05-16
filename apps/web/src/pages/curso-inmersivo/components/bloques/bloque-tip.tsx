import { Banner } from "@/shared/components/ui/banner"
import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import { type VarianteTip, contenidoTipSchema } from "@nexott-learn/shared-types"

interface BloqueTipProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque TIP. Delega al componente base `<Banner>` para heredar
 * la identidad NexoTT (callout editorial en info/neutral; feedback
 * funcional saturado en warning/exito). Antes este bloque duplicaba el
 * patrón con su propio borde/icono/fondo, lo que producía un look
 * Bootstrap-style genérico fuera de la identidad.
 */
const TONO_POR_VARIANTE: Record<VarianteTip, "info" | "warning" | "success"> = {
  info: "info",
  warning: "warning",
  exito: "success",
}

const TITULO_POR_VARIANTE: Record<VarianteTip, string> = {
  info: "Nota",
  warning: "Atención",
  exito: "Buena práctica",
}

export function BloqueTip({ contenido }: BloqueTipProps) {
  const parsed = contenidoTipSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  const html = sanitizarHtml(parsed.data.html)
  if (html.trim().length === 0) {
    return null
  }
  const tono = TONO_POR_VARIANTE[parsed.data.variante]
  const titulo = TITULO_POR_VARIANTE[parsed.data.variante]

  return (
    <Banner tone={tono} title={titulo}>
      <div
        className="tiptap max-w-prose"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML del editor Tiptap, sanitizado.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Banner>
  )
}
