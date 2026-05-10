import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

const FRASES = [
  "Lo que sabes, demostrado.",
  "Listos para la entrevista que importa.",
  "Tu evolución deja huella.",
] as const

const INTERVALO_MS = 5000

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

  const frase = FRASES[index]

  return (
    <div className="relative h-[44px] sm:h-[52px] lg:h-[60px]">
      <AnimatePresence mode="wait">
        <motion.p
          key={frase}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: "blur(6px)" }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 18,
            mass: 0.7,
          }}
          className="absolute inset-0 font-serif text-[26px] text-[var(--color-text-primary)] italic leading-[1.15] sm:text-[30px] lg:text-[36px]"
        >
          {frase}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
