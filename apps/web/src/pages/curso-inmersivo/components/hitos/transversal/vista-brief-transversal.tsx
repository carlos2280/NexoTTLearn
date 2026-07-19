import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { CupoIntentosTransversal, TransversalResponse } from "@nexott-learn/shared-types"
import { AvisoIntentosAgotados } from "./aviso-intentos-agotados"
import { hayIntentosDisponibles } from "./cupo-transversal.helpers"
import { FormEnvioTransversal } from "./form-envio-transversal"
import { LoQueSeEvaluara } from "./lo-que-se-evaluara"

interface VistaBriefTransversalProps {
  readonly transversal: TransversalResponse
  readonly asignacionId: string
  readonly cupo: CupoIntentosTransversal | null
  readonly onIntentoCreado: (intentoId: string) => void
  readonly urlInicial?: string
}

/**
 * Vista 1 del proyecto transversal (spec 05 — sin intento previo). Brief con
 * la descripcion del admin, qué se evalúa (revisión con IA) y form de envio.
 *
 * Cero numeros (umbral, pesos, skills). Solo lo que el participante necesita.
 */
export function VistaBriefTransversal({
  transversal,
  asignacionId,
  cupo,
  onIntentoCreado,
  urlInicial,
}: VistaBriefTransversalProps) {
  // Si el cupo se agotó no hay envío posible (el backend lo rechazaría con 409):
  // en su lugar, el aviso honesto. `cupo === null` (cargando/sin dato) no bloquea.
  const agotado = cupo !== null && !hayIntentosDisponibles(cupo)

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

      <LoQueSeEvaluara criterios={transversal.criteriosEvaluacion} />

      {agotado ? (
        <AvisoIntentosAgotados />
      ) : (
        <FormEnvioTransversal
          asignacionId={asignacionId}
          cupo={cupo}
          urlInicial={urlInicial}
          onIntentoCreado={onIntentoCreado}
        />
      )}
    </section>
  )
}
