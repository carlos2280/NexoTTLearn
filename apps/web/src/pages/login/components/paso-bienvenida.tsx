import { motion, useReducedMotion } from "framer-motion"
import type { UsuarioSesion } from "@/features/auth/types"

interface PasoBienvenidaProps {
  readonly usuario: UsuarioSesion
}

export function PasoBienvenida({ usuario }: PasoBienvenidaProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

  return (
    <div className="relative flex flex-col items-start gap-6 lg:gap-8">
      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease }}
        className="font-medium text-[11px] text-[var(--color-accent-on-soft)] uppercase leading-4 tracking-[0.22em]"
      >
        Acceso confirmado
      </motion.p>

      <motion.h2
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease }}
        className="font-semibold text-[44px] text-[var(--color-text-primary)] leading-[1.02] tracking-[-0.035em] sm:text-[56px] lg:text-[64px]"
      >
        <span className="block">Bienvenido,</span>
        <motion.span
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.5, duration: 0.8, ease }}
          className="font-normal font-serif text-[var(--color-accent)] italic"
        >
          {usuario.nombre}
          <span className="text-[var(--color-text-tertiary)]">.</span>
        </motion.span>
      </motion.h2>

      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease }}
        className="flex flex-col gap-1"
      >
        <p className="max-w-[320px] text-[16px] text-[var(--color-text-secondary)] leading-6">
          Preparamos tu plan personal. Estás a un paso de retomar la preparación.
        </p>
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: 1.4, duration: 1.2, ease: "linear" }}
        className="mt-2 h-[2px] max-w-[200px] bg-[var(--color-accent)]"
        aria-hidden="true"
      />
    </div>
  )
}
