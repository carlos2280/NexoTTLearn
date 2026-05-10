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
    <h1 className="font-semibold text-[64px] text-[var(--color-text-primary)] leading-[0.95] tracking-[-0.045em] sm:text-[80px] lg:text-[96px]">
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
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: reducedMotion ? 0 : baseDelay + LETRAS.length * 0.045 + 0.08,
            type: "spring",
            stiffness: 220,
            damping: 14,
          }}
          className="text-[var(--color-accent)]"
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
          className="font-mono font-normal text-[42px] text-[var(--color-text-tertiary)] tracking-tight sm:text-[52px] lg:text-[60px]"
        >
          learn
        </motion.span>
      </span>
    </h1>
  )
}
