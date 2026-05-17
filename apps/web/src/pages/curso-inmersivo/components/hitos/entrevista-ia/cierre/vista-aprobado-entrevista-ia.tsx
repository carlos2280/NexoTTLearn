import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { DUR, EASE } from "@/shared/lib/motion"
import type { TurnoEntrevistaIa } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { DrawerReleerEntrevista } from "./drawer-releer-entrevista"

interface VistaAprobadoEntrevistaIaProps {
  readonly turnos: readonly TurnoEntrevistaIa[]
  readonly fechaISO: string
}

/**
 * Vista 3a (spec 06) — aprobado. Aurora cumbre como recompensa: eyebrow en
 * aurora-violet, micro-firma drift, CTA aurora con glow. Por debajo, link
 * sutil para abrir el drawer "Releer la entrevista" sin competir con el CTA
 * principal (una jerarquia por pantalla).
 */
export function VistaAprobadoEntrevistaIa({ turnos, fechaISO }: VistaAprobadoEntrevistaIaProps) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const dur = (s: number): number => (reducedMotion ? 0 : s)

  return (
    <section className="flex max-w-xl flex-col items-start gap-6 self-center px-8 py-16">
      <motion.span
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.1), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="nx-eyebrow text-aurora-violet"
      >
        Entrevista superada
      </motion.span>

      <motion.h2
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.2), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="text-display-md text-text-primary leading-tight"
      >
        Lo lograste<span className="text-aurora-violet">.</span>
      </motion.h2>

      <motion.p
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.32), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="text-body text-text-secondary"
      >
        Acabas de completar la entrevista de cierre del curso. Tu camino sigue.
      </motion.p>

      <motion.div
        aria-hidden={true}
        initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: dur(0.5), duration: dur(DUR.cinematic), ease: EASE.default }}
        style={{ background: "var(--gradient-aurora)", transformOrigin: "left center" }}
        className="nx-aurora-drift h-px w-full max-w-[260px] rounded-pill"
      />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.7), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="flex flex-col items-start gap-3"
      >
        <Button variant="aurora" onClick={() => navigate(RUTAS.participante.miFicha)}>
          Ver mi historia
          <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden={true} />
        </Button>
        <button
          type="button"
          onClick={() => setDrawerAbierto(true)}
          className="text-body-sm text-text-tertiary underline-offset-4 transition-colors duration-base ease-default hover:text-text-secondary hover:underline"
        >
          Releer la entrevista
        </button>
      </motion.div>

      <DrawerReleerEntrevista
        abierto={drawerAbierto}
        onCambiarAbierto={setDrawerAbierto}
        turnos={turnos}
        fechaISO={fechaISO}
      />
    </section>
  )
}
