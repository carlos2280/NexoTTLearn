import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { ContenidoCodigoPreguntas } from "@nexott-learn/shared-types"

interface PanelEnunciadoProps {
  readonly contenido: ContenidoCodigoPreguntas
}

export function PanelEnunciado({ contenido }: PanelEnunciadoProps) {
  return (
    <div className="flex flex-col gap-3">
      <article
        className="tiptap max-w-prose text-body-sm text-text-primary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: enunciado del editor admin, sanitizado.
        dangerouslySetInnerHTML={{ __html: sanitizarHtml(contenido.enunciado) }}
      />
      <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
        Tiempo límite · {contenido.tiempoLimiteSeg}s por test
      </p>
    </div>
  )
}
