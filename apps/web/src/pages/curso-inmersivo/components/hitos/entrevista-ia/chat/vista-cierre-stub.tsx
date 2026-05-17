import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface VistaCierreStubProps {
  readonly aprobado: boolean
}

/**
 * Placeholder de la vista 3a/3b post-entrevista (F2). Cuando la IA cierra la
 * conversacion, el chat hace fade-out y este stub lo reemplaza con un
 * mensaje sobrio + CTA a Mi ficha.
 *
 * La vista real con aurora cumbre + drawer "Releer entrevista" llega en F3.
 */
export function VistaCierreStub({ aprobado }: VistaCierreStubProps) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.cinematic / 1000, ease: EASE.default }}
      className="flex max-w-xl flex-col items-start gap-6 self-center px-8 py-16"
    >
      <span className="nx-eyebrow text-aurora-violet">Hito de cierre</span>
      <h2 className="text-display-md text-text-primary leading-tight">
        {aprobado ? "Lo lograste." : "Buen primer recorrido."}
      </h2>
      <p className="text-body text-text-secondary">
        {aprobado
          ? "Acabas de completar la entrevista de cierre del curso. Tu camino sigue."
          : "Hoy no llegamos al nivel del cierre, pero el camino continua. Puedes intentarlo de nuevo cuando quieras."}
      </p>
      <motion.div
        aria-hidden={true}
        initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: DUR.cinematic / 1000, ease: EASE.default }}
        style={{ background: "var(--gradient-aurora)", transformOrigin: "left center" }}
        className="h-px w-full max-w-[260px] rounded-pill"
      />
      <Button variant="aurora" onClick={() => navigate(RUTAS.participante.miFicha)}>
        Ver mi historia
        <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden={true} />
      </Button>
    </motion.section>
  )
}
