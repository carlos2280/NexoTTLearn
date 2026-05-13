import { useSaludoTemporal } from "@/features/admin/layout/hooks/use-saludo-temporal"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { useRelojVivo } from "@/shared/hooks/use-reloj-vivo"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"

export function HeroBienvenida() {
  const { data: usuario } = useUsuarioActual()
  const { saludo } = useSaludoTemporal()
  const { hora, fechaLarga } = useRelojVivo()
  const reduceMotion = useReducedMotion()

  const variantes = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        <motion.div
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: DUR.storytelling, ease: EASE.default }}
          className="nx-eyebrow flex items-center gap-2 text-aurora-violet"
        >
          <span
            aria-hidden={true}
            className="nx-pulse-dot inline-block h-1.5 w-1.5 rounded-pill bg-success"
          />
          <span>{fechaLarga}</span>
          <span className="text-border-strong">·</span>
          <span className="tabular text-text-tertiary">{hora}</span>
        </motion.div>

        <motion.h1
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: DUR.storytelling, delay: 0.05, ease: EASE.default }}
          className="text-display-md text-text-primary leading-[1.05] tracking-tight"
        >
          <span className="text-text-secondary">{saludo},</span>
          {usuario ? <> {usuario.nombre}</> : null}
          <span className="text-aurora-violet">.</span>
        </motion.h1>

        <motion.div
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: DUR.storytelling, delay: 0.12, ease: EASE.default }}
          className="flex max-w-xl flex-col gap-3"
        >
          <p className="font-serif text-h2 text-text-secondary italic leading-snug">
            Tu equipo está{" "}
            <span
              className="text-accent"
              style={{ textShadow: "0 1px 24px rgb(var(--color-accent-rgb) / 0.35)" }}
            >
              aprendiendo
            </span>
            .
          </p>
          <span
            aria-hidden={true}
            className="block h-px w-24 rounded-pill bg-[image:var(--gradient-aurora)] opacity-70"
          />
        </motion.div>
      </div>
    </header>
  )
}
