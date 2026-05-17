import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"

interface MensajeUsuarioProps {
  readonly mensaje: string
}

/**
 * Mensaje del colaborador en el chat. Alineado derecha, bg `accent-soft`
 * muy sutil + eyebrow `TU` en mono. Sin cola/triangulo, sin avatar — calma
 * editorial, no chat de mensajeria.
 */
export function MensajeUsuario({ mensaje }: MensajeUsuarioProps) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base / 1000, ease: EASE.default }}
      className="flex flex-col items-end gap-2"
    >
      <span className="nx-eyebrow text-text-tertiary">Tu</span>
      <div className="max-w-[85%] rounded-2xl bg-accent-soft px-4 py-3">
        <p className="whitespace-pre-line text-accent-on-soft text-body leading-relaxed">
          {mensaje}
        </p>
      </div>
    </motion.article>
  )
}
