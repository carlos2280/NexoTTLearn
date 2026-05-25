import { motion, useReducedMotion } from "framer-motion"

export function IndicadorVida() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="nx-eyebrow inline-flex items-center gap-2 text-text-tertiary"
      style={{ letterSpacing: "0.14em" }}
    >
      <span className="relative inline-flex h-2 w-2 items-center justify-center">
        <span className="nx-pulse-dot absolute inset-0 rounded-pill bg-success text-success" />
        <span className="relative h-2 w-2 rounded-pill bg-success" />
      </span>
      <span className="tabular font-mono text-text-secondary">Sistema activo</span>
    </motion.div>
  )
}
