import { motion, useReducedMotion } from "framer-motion"

const LETRAS = [
  { char: "N", pos: 0 },
  { char: "e", pos: 1 },
  { char: "x", pos: 2 },
  { char: "o", pos: 3 },
  { char: "T", pos: 4 },
  { char: "T2", pos: 5 },
] as const

export function WordmarkHero() {
  const reducedMotion = useReducedMotion()
  const baseDelay = 0.15

  return (
    <h1 className="text-h1 text-text-primary sm:text-display-md lg:text-display-lg xl:text-display-xl">
      <span className="inline-flex items-baseline gap-3">
        <span className="inline-flex">
          {LETRAS.map(({ char, pos }) => (
            <motion.span
              key={char}
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: reducedMotion ? 0 : baseDelay + pos * 0.045,
                type: "spring",
                stiffness: 90,
                damping: 16,
                mass: 0.6,
              }}
              className="inline-block"
            >
              {char === "T2" ? "T" : char}
            </motion.span>
          ))}
        </span>
        <motion.span
          aria-hidden="true"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.2 }}
          animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [0.2, 1.18, 1] }}
          transition={{
            delay: reducedMotion ? 0 : baseDelay + LETRAS.length * 0.045 + 0.08,
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative inline-flex items-center justify-center text-accent"
          style={{ textShadow: "0 0 24px rgb(var(--color-accent-rgb) / 0.45)" }}
        >
          ·
        </motion.span>
        <motion.span
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: reducedMotion ? 0 : baseDelay + LETRAS.length * 0.045 + 0.2,
            type: "spring",
            stiffness: 90,
            damping: 18,
          }}
          className="font-mono font-normal text-[0.62em] text-text-tertiary tracking-tight"
        >
          learn
        </motion.span>
      </span>
    </h1>
  )
}
