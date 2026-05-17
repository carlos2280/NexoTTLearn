import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { ExternalLink } from "lucide-react"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface VistaEvaluandoStubProps {
  readonly intento: IntentoTransversalParticipanteResponse
}

/**
 * Placeholder de la "vista 2" del transversal (en evaluacion) para F1. Aun no
 * polleamos — esta version solo confirma visualmente que el envio se persistio
 * y muestra el intento creado. La vista 2 completa con polling viene en F2.
 */
export function VistaEvaluandoStub({ intento }: VistaEvaluandoStubProps) {
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
        <div className="flex items-center gap-3">
          <a
            href={intento.repoOArtefacto.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-mono text-accent text-body-sm hover:underline"
          >
            {intento.repoOArtefacto.url.replace(RGX_HTTPS_PREFIJO, "")}
            <ExternalLink className="h-3 w-3" aria-hidden={true} />
          </a>
        </div>
        <div className="flex items-center gap-2">
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
