import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { ContenidoCodigoPreguntas } from "@nexott-learn/shared-types"

interface PanelEnunciadoProps {
  readonly contenido: ContenidoCodigoPreguntas
  readonly puedeEjecutar: boolean
}

export function PanelEnunciado({ contenido, puedeEjecutar }: PanelEnunciadoProps) {
  return (
    <div className="flex flex-col gap-3">
      <article
        className="tiptap max-w-prose text-body-sm text-text-primary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: enunciado del editor admin, sanitizado.
        dangerouslySetInnerHTML={{ __html: sanitizarHtml(contenido.enunciado) }}
      />
      {contenido.modoSimple && contenido.rubrica.trim().length > 0 ? (
        <aside className="rounded-xl border border-info/30 bg-info-soft p-3 text-body-sm text-info-on-soft">
          <p className="nx-eyebrow mb-1 text-info-on-soft">Rúbrica (revisión manual)</p>
          <div
            className="tiptap text-body-sm"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: rúbrica del admin, sanitizada.
            dangerouslySetInnerHTML={{ __html: sanitizarHtml(contenido.rubrica) }}
          />
        </aside>
      ) : null}
      {puedeEjecutar ? null : (
        <p className="rounded-xl border border-border bg-subtle p-3 text-body-sm text-text-secondary">
          Este reto se evalúa manualmente. El admin revisará tu envío.
        </p>
      )}
      <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
        Tiempo límite · {contenido.tiempoLimiteSeg}s por test
      </p>
    </div>
  )
}
