import { motion, useReducedMotion } from "framer-motion"

export function PasoCerrando() {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

  return (
    <div className="flex flex-col items-start gap-6">
      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="nx-eyebrow text-warmth-on-soft"
      >
        Cerrando sesión
      </motion.p>

      <motion.h2
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease }}
        className="text-h1 text-text-primary"
      >
        Asegurando tu ficha<span className="text-warmth">.</span>
      </motion.h2>

      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center gap-3"
        aria-live="polite"
      >
        <span className="relative inline-flex h-2 w-2 items-center justify-center">
          <span className="nx-pulse-dot absolute inset-0 rounded-pill bg-warmth text-warmth" />
          <span className="relative h-2 w-2 rounded-pill bg-warmth" />
        </span>
        <span className="text-body-sm text-text-secondary">Un segundo, por favor</span>
      </motion.div>
    </div>
  )
}
