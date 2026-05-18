import { Button } from "@/shared/components/ui/button"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { ExternalLink, RefreshCw } from "lucide-react"
import { HistorialIntentosTransversal } from "./historial-intentos-transversal"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface VistaAunNoTransversalProps {
  readonly intento: IntentoTransversalParticipanteResponse
  readonly intentos: readonly IntentoTransversalParticipanteResponse[]
  readonly onIntentarDeNuevo: () => void
}

/**
 * Vista 3b del transversal (spec 05) — no aprobado, sin rojo ni numeros.
 * Mensaje motivador en lugar de burocratico ("Casi." vs "Aun no")
 * coherente con la calidez sobria del manifiesto. El CTA vuelve al brief
 * (form de envio); el prellenado de URL anterior llega en F3.
 */
export function VistaAunNoTransversal({
  intento,
  intentos,
  onIntentarDeNuevo,
}: VistaAunNoTransversalProps) {
  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="nx-eyebrow text-text-tertiary">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">Casi.</h2>
        <p className="text-body text-text-secondary">
          Necesita ajustes para el nivel que pide el cierre. Puedes enviar otro intento; el mejor
          cuenta.
        </p>
      </header>

      <div>
        <Button onClick={onIntentarDeNuevo}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden={true} />
          Enviar otro intento
        </Button>
      </div>

      <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">Tu ultimo intento</span>
        <a
          href={intento.repoOArtefacto.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex w-fit items-center gap-1.5 font-mono text-accent text-body-sm hover:underline"
        >
          {intento.repoOArtefacto.url.replace(RGX_HTTPS_PREFIJO, "")}
          <ExternalLink className="h-3 w-3" aria-hidden={true} />
        </a>
        <p className="text-caption text-text-tertiary">{tiempoRelativo(intento.fecha)}</p>
      </article>

      <HistorialIntentosTransversal intentos={intentos} />
    </section>
  )
}
