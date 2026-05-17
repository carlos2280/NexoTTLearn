import { motion, useReducedMotion } from "framer-motion"

/**
 * Indicador "el evaluador esta escribiendo": tres dots aurora-cyan con
 * pulse escalonado. Aparece mientras esperamos la respuesta de la IA tras
 * enviar un turno. Mismo lenguaje visual que `nx-pulse-dot` del manifiesto.
 */
export function IndicadorEscribiendo() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-2 px-1"
    >
      <span className="nx-eyebrow text-text-tertiary">Evaluador</span>
      <div className="flex items-center gap-1.5 pl-1" aria-label="El evaluador esta escribiendo">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden={true}
            className="inline-block h-1.5 w-1.5 rounded-pill bg-aurora-cyan"
            style={{
              animation: reducedMotion ? undefined : `nx-pulse 1.4s ${i * 0.18}s ease-out infinite`,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
