import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { DUR, EASE } from "@/shared/lib/motion"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface VistaAprobadoTransversalProps {
  readonly intento: IntentoTransversalParticipanteResponse
  readonly tieneEntrevistaIa: boolean
  readonly onIrAEntrevistaIa: () => void
}

/**
 * Vista 3a del transversal (spec 05) — proyecto aprobado. Recompensa cumbre
 * humanizada: aurora drift 1px como firma, titulo en pasado sobrio ("Lo
 * aprobaste.") en lugar del "¡PROYECTO APROBADO!" gritado original
 * (coherente con 08-D-01).
 *
 * CTA condicional: si el curso tiene Entrevista IA, invita al siguiente
 * hito; si no, invita a Mi ficha (cierre del viaje).
 */
export function VistaAprobadoTransversal({
  intento,
  tieneEntrevistaIa,
  onIrAEntrevistaIa,
}: VistaAprobadoTransversalProps) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  const irASiguiente = (): void => {
    if (tieneEntrevistaIa) {
      onIrAEntrevistaIa()
      return
    }
    navigate(RUTAS.participante.miFicha)
  }

  const lineaTransicion = reducedMotion
    ? { duration: 0 }
    : { delay: 0.35, duration: DUR.cinematic / 1000, ease: EASE.default }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="nx-eyebrow text-aurora-violet">Hito de cierre</span>
        <h2 className="text-display-md text-text-primary leading-tight">Lo aprobaste.</h2>
        <p className="text-body text-text-secondary">
          Acabas de demostrar que sabes integrar todo lo del curso en un proyecto real.
        </p>
        <motion.div
          aria-hidden={true}
          initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={lineaTransicion}
          style={{ background: "var(--gradient-aurora)", transformOrigin: "left center" }}
          className="mt-3 h-px max-w-[260px] rounded-pill"
        />
        <p className="mt-2 text-body-sm text-text-secondary">
          {tieneEntrevistaIa
            ? "Sigues hacia la entrevista IA."
            : "Tu cierre ya esta en tu ficha. Sigue construyendo tu camino."}
        </p>
      </header>

      <div>
        <Button variant="aurora" onClick={irASiguiente}>
          {tieneEntrevistaIa ? "Ir a la entrevista IA" : "Ver mi historia"}
          <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden={true} />
        </Button>
      </div>

      <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
        <span className="nx-eyebrow text-text-tertiary">Tu intento aprobado</span>
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
    </section>
  )
}
