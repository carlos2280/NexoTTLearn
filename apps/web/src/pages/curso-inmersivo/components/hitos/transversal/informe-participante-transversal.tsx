import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { InformeParticipante } from "@nexott-learn/shared-types"

interface InformeParticipanteTransversalProps {
  readonly informe: InformeParticipante | null
}

/**
 * Feedback curado por el admin que ve el participante (B3): resumen + áreas a
 * reforzar. Solo llega cuando el intento está FINALIZADO (antes es `null`).
 * Nunca muestra el informe crudo de la IA ni las notas por dimensión. Si no hay
 * nada curado, no renderiza (la vista conserva su propio encabezado).
 */
export function InformeParticipanteTransversal({ informe }: InformeParticipanteTransversalProps) {
  const resumen = informe?.resumen?.trim() ?? ""
  const aReforzar = informe?.aReforzar ?? []
  if (resumen.length === 0 && aReforzar.length === 0) {
    return null
  }
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <span className="nx-eyebrow text-text-tertiary">Comentario de tu evaluador</span>
      {resumen.length > 0 ? (
        <div
          className="tiptap max-w-prose text-body text-text-secondary"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: informe curado por el admin, sanitizado.
          dangerouslySetInnerHTML={{ __html: sanitizarHtml(resumen) }}
        />
      ) : null}
      {aReforzar.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="nx-eyebrow text-text-tertiary">A reforzar</span>
          <ul className="flex flex-col gap-2">
            {aReforzar.map((r, i) => (
              <li key={`${i}-${r.que}`} className="flex flex-col">
                <span className="text-body-sm text-text-primary">{r.que}</span>
                <span className="text-caption text-text-tertiary">{r.sugerencia}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}
