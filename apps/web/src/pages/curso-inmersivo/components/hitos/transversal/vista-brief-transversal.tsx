import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { TransversalResponse } from "@nexott-learn/shared-types"
import { FormEnvioTransversal } from "./form-envio-transversal"
import { LoQueSeEvaluara } from "./lo-que-se-evaluara"

interface VistaBriefTransversalProps {
  readonly transversal: TransversalResponse
  readonly asignacionId: string
  readonly onIntentoCreado: (intentoId: string) => void
  readonly urlInicial?: string
}

/**
 * Vista 1 del proyecto transversal (spec 05 — sin intento previo). Brief con
 * la descripcion del admin, lista de capas activas y form de envio.
 *
 * Cero numeros (umbral, pesos, skills). Solo lo que el participante necesita.
 */
export function VistaBriefTransversal({
  transversal,
  asignacionId,
  onIntentoCreado,
  urlInicial,
}: VistaBriefTransversalProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-aurora-violet">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">Proyecto transversal</h2>
        <article
          className="tiptap max-w-prose text-body text-text-secondary"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: descripcion del editor admin, sanitizada.
          dangerouslySetInnerHTML={{ __html: sanitizarHtml(transversal.descripcion) }}
        />
      </header>

      <LoQueSeEvaluara capasActivas={transversal.capasActivas} />

      <FormEnvioTransversal
        asignacionId={asignacionId}
        urlInicial={urlInicial}
        onIntentoCreado={onIntentoCreado}
      />
    </section>
  )
}
