import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { ExternalLink } from "lucide-react"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface VistaEnRevisionTransversalProps {
  readonly intento: IntentoTransversalParticipanteResponse
}

/**
 * Vista del transversal cuando el intento está EVALUADO: la IA ya terminó y el
 * admin está revisando el resultado antes de liberar el veredicto. Acuse honesto
 * SIN nota y SIN botón de reenviar — evita el falso "Casi" que aparecía cuando
 * este estado intermedio caía en la vista de "no aprobado". El polling sigue
 * vivo en el orquestador hasta FINALIZADO, así la vista conmuta sola al veredicto.
 */
export function VistaEnRevisionTransversal({ intento }: VistaEnRevisionTransversalProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">Recibimos tu proyecto.</h2>
        <p className="text-body text-text-secondary">
          Tu administrador está revisando el resultado. Te avisaremos apenas haya un veredicto — no
          necesitas hacer nada más.
        </p>
      </header>

      <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">Tu entrega</span>
        <a
          href={intento.repoOArtefacto.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-accent text-body-sm hover:underline"
        >
          {intento.repoOArtefacto.url.replace(RGX_HTTPS_PREFIJO, "")}
          <ExternalLink className="h-3 w-3" aria-hidden={true} />
        </a>
        <p className="text-caption text-text-tertiary">Enviado {tiempoRelativo(intento.fecha)}</p>
        <div className="mt-1 flex items-center gap-2">
          <span aria-hidden={true} className="inline-block h-2 w-2 rounded-pill bg-text-tertiary" />
          <span className="text-body-sm text-text-secondary">En revisión por tu administrador</span>
        </div>
      </article>
    </section>
  )
}
