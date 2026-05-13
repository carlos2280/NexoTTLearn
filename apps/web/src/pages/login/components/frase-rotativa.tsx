import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

/**
 * Frases que reflejan el ADN del producto: preparación interna para la
 * entrevista final con un cliente. No edu blando, no genérico.
 */
const FRASES = [
  {
    cuerpo: "La entrevista del cliente",
    enfasis: "comienza aquí.",
  },
  {
    cuerpo: "Lo que dominas hoy",
    enfasis: "abre la entrevista de mañana.",
  },
  {
    cuerpo: "Tu ficha de skills",
    enfasis: "viaja contigo, no con el curso.",
  },
] as const

const INTERVALO_MS = 5400

export function FraseRotativa() {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reducedMotion) {
      return
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % FRASES.length)
    }, INTERVALO_MS)
    return () => window.clearInterval(id)
  }, [reducedMotion])

  const frase = FRASES[index] ?? FRASES[0]

  return (
    <div className="relative h-[88px] sm:h-[100px] lg:h-[120px]">
      <AnimatePresence mode="wait">
        <motion.p
          key={frase.cuerpo}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, filter: "blur(6px)" }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
            mass: 0.7,
          }}
          className="absolute inset-0 flex flex-col gap-1 text-quote text-white"
          style={{ textShadow: "var(--shadow-text-aurora)" }}
        >
          <span>{frase.cuerpo}</span>
          <span className="font-serif text-aurora-cyan italic">{frase.enfasis}</span>
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
