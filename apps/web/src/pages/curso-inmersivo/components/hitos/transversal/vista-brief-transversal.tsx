import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { CupoIntentosTransversal, TransversalResponse } from "@nexott-learn/shared-types"
import { ArrowLeft } from "lucide-react"
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
  /** Volver al resultado sin enviar. Solo llega al reintentar (hay un resultado previo). */
  readonly onVolver?: () => void
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
  onVolver,
}: VistaBriefTransversalProps) {
  // Si el cupo se agotó no hay envío posible (el backend lo rechazaría con 409):
  // en su lugar, el aviso honesto. `cupo === null` (cargando/sin dato) no bloquea.
  const agotado = cupo !== null && !hayIntentosDisponibles(cupo)

  return (
    <section className="flex flex-col gap-6">
      {onVolver ? (
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex w-fit items-center gap-1.5 self-start text-body-sm text-text-secondary transition-colors duration-base ease-default hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden={true} />
          Volver al resultado
        </button>
      ) : null}

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
