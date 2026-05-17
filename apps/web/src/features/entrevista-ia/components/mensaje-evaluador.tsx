import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { useTextoProgresivo } from "./use-texto-progresivo"

interface MensajeEvaluadorProps {
  readonly mensaje: string
  /**
   * Si `true`, el mensaje aparece palabra-a-palabra (streaming visual). Solo
   * aplicamos streaming al ULTIMO turno recien llegado de la IA. Los previos
   * en la transcripcion se renderizan completos.
   */
  readonly streaming: boolean
}

/**
 * Mensaje del evaluador IA. Editorial sobrio: alineado izquierda, fondo
 * transparente, eyebrow `EVALUADOR` en mono. Sin bubble, sin avatar.
 *
 * Cuando `streaming=true`, el texto se reproduce palabra-por-palabra para
 * dar sensacion de "la IA esta escribiendo en vivo" (mientras el backend
 * no soporte SSE/streaming real — B-17).
 */
export function MensajeEvaluador({ mensaje, streaming }: MensajeEvaluadorProps) {
  const reducedMotion = useReducedMotion()
  const activado = streaming && !reducedMotion
  const { visible } = useTextoProgresivo({ texto: mensaje, activado })
  const textoFinal = activado ? visible : mensaje

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base / 1000, ease: EASE.default }}
      className="flex flex-col gap-2 px-1"
    >
      <span className="nx-eyebrow text-text-tertiary">Evaluador</span>
      <p className="whitespace-pre-line text-body text-text-primary leading-relaxed">
        {textoFinal}
        {activado && textoFinal.length < mensaje.length ? (
          <span
            aria-hidden={true}
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-aurora-violet/60 align-middle"
          />
        ) : null}
      </p>
    </motion.article>
  )
}
