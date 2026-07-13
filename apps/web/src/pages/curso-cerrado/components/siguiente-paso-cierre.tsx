import { motion, useReducedMotion } from "framer-motion"

// Cierre NO_APTO: tras mostrar que le falto, el alumno necesita el "y ahora
// que". El mensaje es honesto (no es definitivo) y accionable (a quien acudir).
// El mecanismo real existe: el admin puede reabrir el caso
// (POST /asignaciones/:id/reabrir-caso) -> no se le promete algo falso.
export function SiguientePasoCierre() {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

  return (
    <motion.section
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.7, ease }}
      className="flex flex-col items-center gap-3 text-center"
      aria-labelledby="siguiente-paso-titulo"
    >
      <span id="siguiente-paso-titulo" className="nx-eyebrow font-mono text-text-tertiary">
        Siguiente paso
      </span>
      <p className="max-w-[42ch] text-body text-text-secondary leading-relaxed">
        Esto no es el final. Tu administrador puede{" "}
        <span className="font-medium text-text-primary">reabrir tu caso</span> para que refuerces
        estas areas. Conversa con el para dar el siguiente paso.
      </p>
    </motion.section>
  )
}
