import { Button } from "@/shared/components/ui/button"
import { DUR, EASE } from "@/shared/lib/motion"
import type { TurnoEntrevistaIa } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useState } from "react"
import { DrawerReleerEntrevista } from "./drawer-releer-entrevista"

interface VistaAunNoEntrevistaIaProps {
  readonly turnos: readonly TurnoEntrevistaIa[]
  readonly fechaISO: string
  /**
   * Cierra la vista y devuelve al brief. El brief recarga disponibilidad y
   * decide si mostrar "Iniciar entrevista" o la vista bloqueada
   * (`RATE_LIMIT_HORA`, etc.). No duplicamos esa logica aqui.
   */
  readonly onCerrar: () => void
}

/**
 * Vista 3b (spec 06) — aún no aprobado. Sin rojo, sin "REPROBADO". Copy
 * humanizado ("Casi.") en línea con la vista equivalente del transversal.
 * Aurora suave acompaña pero sin la sensacion de "premio" de la 3a.
 */
export function VistaAunNoEntrevistaIa({
  turnos,
  fechaISO,
  onCerrar,
}: VistaAunNoEntrevistaIaProps) {
  const reducedMotion = useReducedMotion()
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const dur = (s: number): number => (reducedMotion ? 0 : s)

  return (
    <section className="flex max-w-xl flex-col items-start gap-6 self-center px-8 py-16">
      <motion.span
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.1), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="nx-eyebrow text-text-tertiary"
      >
        Hito de cierre
      </motion.span>

      <motion.h2
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.2), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="text-display-md text-text-primary leading-tight"
      >
        Casi<span className="text-aurora-violet">.</span>
      </motion.h2>

      <motion.p
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.32), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="text-body text-text-secondary"
      >
        Hoy no llegamos al cierre. Cuando quieras vuelves a intentarlo — cada conversación deja algo
        aprendido.
      </motion.p>

      <motion.div
        aria-hidden={true}
        initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: dur(0.5), duration: dur(DUR.cinematic), ease: EASE.default }}
        className="h-px w-full max-w-[200px] rounded-pill bg-border-strong"
      />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: dur(0.7), duration: dur(DUR.storytelling), ease: EASE.default }}
        className="flex flex-col items-start gap-3"
      >
        <Button variant="primary" onClick={onCerrar}>
          Hacer otra entrevista
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
