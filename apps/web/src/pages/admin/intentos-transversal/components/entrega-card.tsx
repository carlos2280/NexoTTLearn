import type { IntentoTransversalAdminResponse } from "@nexott-learn/shared-types"
import { ExternalLink } from "lucide-react"

interface EntregaCardProps {
  readonly intento: IntentoTransversalAdminResponse
}

/**
 * Muestra lo que el colaborador entrego: URL del repositorio (clickable, abre
 * en pestana nueva) y comentario opcional. Es el contexto del admin antes de
 * cargar las capas.
 */
export function EntregaCard({ intento }: EntregaCardProps) {
  const url = intento.repoOArtefacto.url
  const comentario = intento.comentarioColaborador?.trim()
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Entrega</span>
        <h2 className="text-h3 text-text-primary">Repositorio del colaborador</h2>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-accent text-body transition-colors hover:text-accent-hover hover:underline"
      >
        <span className="break-all">{url}</span>
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden={true} />
      </a>
      {comentario ? (
        <div className="flex flex-col gap-1.5 border-border border-t pt-4">
          <span className="nx-eyebrow text-text-tertiary">Comentario del colaborador</span>
          <p className="whitespace-pre-wrap text-body text-text-primary">{comentario}</p>
        </div>
      ) : null}
    </section>
  )
}
