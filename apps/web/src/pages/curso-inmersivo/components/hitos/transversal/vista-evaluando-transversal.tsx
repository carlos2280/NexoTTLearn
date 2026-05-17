import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { ExternalLink } from "lucide-react"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface VistaEvaluandoTransversalProps {
  readonly intento: IntentoTransversalParticipanteResponse
}

/**
 * Vista 2 del transversal (spec 05) — intento en evaluacion. El polling vive
 * en el orquestador via `useListarIntentosTransversal({ pollingActivo: true })`;
 * cuando el intento finaliza, el orquestador conmuta a vista 3a o 3b.
 */
export function VistaEvaluandoTransversal({ intento }: VistaEvaluandoTransversalProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">
          Tu proyecto esta siendo evaluado.
        </h2>
        <p className="text-body text-text-secondary">
          Tomate un cafe — te avisaremos cuando este. Mientras tanto puedes seguir estudiando.
        </p>
      </header>

      <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">Tu intento</span>
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
          <span
            aria-hidden={true}
            className="nx-pulse-dot inline-block h-2 w-2 rounded-pill bg-aurora-cyan"
            style={{ boxShadow: "0 0 8px 2px rgb(var(--color-aurora-cyan-rgb) / 0.35)" }}
          />
          <span className="text-body-sm text-text-secondary">En evaluacion</span>
        </div>
      </article>
    </section>
  )
}
