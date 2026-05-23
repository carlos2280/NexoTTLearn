import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { DUR, EASE } from "@/shared/lib/motion"
import { tiempoRelativo } from "@/shared/lib/tiempo-relativo"
import type { IntentoTransversalParticipanteResponse } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { HistorialIntentosTransversal } from "./historial-intentos-transversal"

const RGX_HTTPS_PREFIJO = /^https:\/\//

interface SkillDemostrada {
  readonly skillId: string
  readonly nombre: string
}

interface VistaAprobadoTransversalProps {
  readonly intento: IntentoTransversalParticipanteResponse
  readonly intentos: readonly IntentoTransversalParticipanteResponse[]
  readonly tieneEntrevistaIa: boolean
  readonly skillsDemostradas: readonly SkillDemostrada[]
}

/**
 * Vista 3a del transversal (spec 05) — proyecto aprobado. Recompensa cumbre
 * humanizada: aurora drift 1px como firma, titulo en pasado sobrio ("Lo
 * aprobaste.") en lugar del "¡PROYECTO APROBADO!" gritado original
 * (coherente con 08-D-01).
 *
 * Sin CTA cruzado a la entrevista IA: la vista se mantiene enfocada en el
 * transversal y el usuario navega al siguiente hito desde el sidebar o el
 * panel "Hacia el cierre". Si el curso NO tiene entrevista IA, el CTA invita
 * a Mi ficha (cierre real del viaje).
 */
export function VistaAprobadoTransversal({
  intento,
  intentos,
  tieneEntrevistaIa,
  skillsDemostradas,
}: VistaAprobadoTransversalProps) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

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
      </header>

      {skillsDemostradas.length > 0 ? (
        <article className="flex flex-col gap-3">
          <span className="nx-eyebrow text-text-tertiary">Con este proyecto demostraste</span>
          <ul className="flex flex-wrap gap-2">
            {skillsDemostradas.map((skill) => (
              <li
                key={skill.skillId}
                className="rounded-pill border border-border bg-subtle px-3 py-1 text-body-sm text-text-secondary"
              >
                {skill.nombre}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <p className="text-body-sm text-text-secondary">
        <strong className="font-medium text-aurora-violet">Tu proyecto queda en tu ficha.</strong>{" "}
        Cualquier admin del cliente puede consultarlo al evaluar tu perfil.
      </p>

      {tieneEntrevistaIa ? null : (
        <div>
          <Button variant="aurora" onClick={() => navigate(RUTAS.participante.miFicha)}>
            Ver mi historia
            <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden={true} />
          </Button>
        </div>
      )}

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

      <HistorialIntentosTransversal intentos={intentos} />
    </section>
  )
}
