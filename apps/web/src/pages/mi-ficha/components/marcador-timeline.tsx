import { motion, useReducedMotion } from "framer-motion"

/**
 * Marcadores del timeline de /mi-ficha. Comparten el mismo grid de
 * `EventoItem` (`100px · auto · 1fr`) para que se alineen perfectamente como
 * "anclas" del eje temporal. Solo dos variantes:
 *
 *  - `presente` — siempre arriba del timeline. Punto aurora pulsante. Marca
 *    visualmente "estas aqui".
 *  - `inicio`   — solo al final cuando no hay mas eventos por cargar. Anillo
 *    abierto, copy sobrio. Da forma al viaje sin inventar fechas.
 */

export function MarcadorPresente() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18, mass: 0.6 }}
      className="grid grid-cols-[100px_auto_1fr] items-center gap-3 py-3"
    >
      <span className="nx-eyebrow text-aurora-violet">Hoy</span>
      <span
        aria-hidden="true"
        className="nx-pulse-dot block h-3 w-3 shrink-0 rounded-full bg-aurora-violet"
        style={{ boxShadow: "0 0 12px 2px rgb(var(--color-aurora-violet-rgb) / 0.35)" }}
      />
      <p className="text-body text-text-primary">Aqui estas.</p>
    </motion.div>
  )
}

export function MarcadorInicio() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18, mass: 0.6 }}
      className="grid grid-cols-[100px_auto_1fr] items-center gap-3 py-3"
    >
      <span className="text-caption text-text-tertiary">Inicio</span>
      <span
        aria-hidden="true"
        className="block h-2 w-2 shrink-0 rounded-full border-2 border-border-strong"
      />
      <p className="text-body-sm text-text-tertiary">Aqui empieza tu historia.</p>
    </motion.div>
  )
}
