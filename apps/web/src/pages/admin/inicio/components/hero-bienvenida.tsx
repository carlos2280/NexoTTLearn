import { useSaludoTemporal } from "@/features/admin/layout/hooks/use-saludo-temporal"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { useRelojVivo } from "@/shared/hooks/use-reloj-vivo"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { PulsoDelDia } from "./pulso-del-dia"

export function HeroBienvenida() {
  const { data: usuario } = useUsuarioActual()
  const { saludo } = useSaludoTemporal()
  const { hora, fechaLarga } = useRelojVivo()
  const reduceMotion = useReducedMotion()

  const variantes = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

  return (
    <header className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
      <div className="flex flex-col gap-6">
        <motion.div
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: DUR.storytelling, ease: EASE.default }}
          className="nx-eyebrow flex items-center gap-2 text-text-tertiary"
        >
          <span
            aria-hidden={true}
            className="nx-pulse-dot inline-block h-1.5 w-1.5 rounded-pill bg-success"
          />
          <span>{fechaLarga}</span>
          <span className="text-border-strong">·</span>
          <span className="tabular">{hora}</span>
        </motion.div>

        <motion.h1
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: DUR.storytelling, delay: 0.05, ease: EASE.default }}
          className="text-display-md text-text-primary leading-[1.05] tracking-tight"
        >
          <span className="text-text-secondary">{saludo},</span>
          {usuario ? <> {usuario.nombre}</> : null}
          <span className="text-accent">.</span>
        </motion.h1>

        <motion.p
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: DUR.storytelling, delay: 0.12, ease: EASE.default }}
          className="max-w-xl font-serif text-h2 text-text-secondary italic leading-snug"
        >
          Tu equipo está <span className="text-accent">aprendiendo</span>.
        </motion.p>
      </div>

      <PulsoDelDia valor={87} descripcion="El sistema respira tranquilo." />
    </header>
  )
}
