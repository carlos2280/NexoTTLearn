import type { UsuarioSesion } from "@/features/auth/types"
import { motion, useReducedMotion } from "framer-motion"

interface PasoBienvenidaProps {
  readonly usuario: UsuarioSesion
}

export function PasoBienvenida({ usuario }: PasoBienvenidaProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

  return (
    <div className="relative flex flex-col items-start gap-6 lg:gap-8">
      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease }}
        className="nx-eyebrow text-aurora-violet"
      >
        Identidad verificada
      </motion.p>

      <motion.h2
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease }}
        className="text-h1 text-text-primary sm:text-display-md lg:text-display-lg"
      >
        <span className="block">Listo,</span>
        <motion.span
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.5, duration: 0.8, ease }}
          className="font-normal font-serif text-aurora-violet italic"
        >
          {usuario.nombre}
          <span className="text-aurora-cyan">.</span>
        </motion.span>
      </motion.h2>

      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6, ease }}
        className="flex flex-col gap-2"
      >
        <p className="max-w-[320px] text-body-lg text-text-secondary">
          Retomemos donde lo dejaste. Tu plan ya te espera.
        </p>
        <p className="nx-eyebrow font-mono text-text-tertiary">Llevándote a tu bandeja</p>
      </motion.div>

      {/* Línea de progreso — sincronizada con DURACION_BIENVENIDA_MS del hook.
          La línea termina justo antes de que el flujo navegue al dashboard. */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: 1.4, duration: 2.6, ease: "linear" }}
        className="mt-2 h-[2px] max-w-[200px] rounded-pill bg-[image:var(--gradient-aurora)]"
        aria-hidden="true"
      />
    </div>
  )
}
