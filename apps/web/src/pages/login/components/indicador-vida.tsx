import { motion, useReducedMotion } from "framer-motion"

export function IndicadorVida() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="inline-flex items-center gap-2 font-medium text-[11px] text-[var(--color-text-tertiary)] uppercase leading-4 tracking-[0.14em]"
    >
      <span className="relative inline-flex h-2 w-2 items-center justify-center">
        <span className="nx-pulse-dot absolute inset-0 rounded-full bg-[var(--color-success)] text-[var(--color-success)]" />
        <span className="relative h-2 w-2 rounded-full bg-[var(--color-success)]" />
      </span>
      <span className="tabular font-mono text-[var(--color-text-secondary)]">Sistema activo</span>
    </motion.div>
  )
}
