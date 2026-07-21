import { Button } from "@/shared/components/ui/button"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { ExternalLink, RefreshCw } from "lucide-react"
import { HistorialIntentosTransversal } from "./historial-intentos-transversal"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface VistaRepoInaccesibleTransversalProps {
  readonly intento: IntentoTransversalParticipanteResponse
  readonly intentos: readonly IntentoTransversalParticipanteResponse[]
  readonly onIntentarDeNuevo: () => void
}

/**
 * Vista del transversal cuando el repo entregado no se pudo abrir: privado, URL
 * muerta, timeout o sin archivos legibles (estado FALLO_ACCESO_REPO, B2c). Da
 * feedback honesto + reenviar, en vez de dejar al alumno colgado en "En
 * evaluación". El intento no consume cupo, así que reenviar siempre procede.
 */
export function VistaRepoInaccesibleTransversal({
  intento,
  intentos,
  onIntentarDeNuevo,
}: VistaRepoInaccesibleTransversalProps) {
  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="nx-eyebrow text-text-tertiary">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">
          No pudimos acceder a tu repositorio
        </h2>
        <p className="text-body text-text-secondary">
          Revisa que sea público y que el enlace esté bien, y vuélvelo a enviar. Este intento no
          cuenta.
        </p>
      </header>

      <Button className="self-start" onClick={onIntentarDeNuevo}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden={true} />
        Enviar de nuevo
      </Button>

      <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">El repositorio que enviaste</span>
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
