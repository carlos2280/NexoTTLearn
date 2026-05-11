import { motion, useReducedMotion } from "framer-motion"

/**
 * Pequeño panel técnico de identidad — refuerza la sensación de
 * "sistema interno de la consultora", no portal público.
 * Más sutil que un logo, más útil que decorativo.
 */
export function MarcaCockpit() {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="inline-flex items-center gap-3 rounded-pill border border-border bg-surface/70 px-3 py-1.5 backdrop-blur-sm"
    >
      <span className="relative inline-flex h-2 w-2 items-center justify-center">
        <span className="nx-pulse-dot absolute inset-0 rounded-pill bg-success text-success" />
        <span className="relative h-2 w-2 rounded-pill bg-success" />
      </span>
      <span className="nx-eyebrow tabular font-mono text-text-secondary">NXT · INTERNAL</span>
      <span className="h-1 w-1 rounded-pill bg-text-tertiary" />
      <span className="nx-eyebrow tabular font-mono text-text-tertiary">v1.0</span>
    </motion.div>
  )
}
