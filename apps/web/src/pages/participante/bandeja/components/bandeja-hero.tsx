import type { BandejaHero, BandejaSaludo } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"

interface BandejaHeroBlockProps {
  readonly hero: BandejaHero
}

function etiquetaSaludo(saludo: BandejaSaludo): string {
  switch (saludo) {
    case "MANANA":
      return "Buenos dias"
    case "TARDE":
      return "Buenas tardes"
    case "NOCHE":
      return "Buenas noches"
    default: {
      const _exhaustive: never = saludo
      return _exhaustive
    }
  }
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.1 doc canonico. Saludo eyebrow + nombre 60-72px + subtitulo. Stagger
// d1→d2→d3 (saludo → nombre → subtitulo). py-16 — el hero respira sobre el
// ambient mesh (manifesto §1.3 "todo respira").
export function BandejaHeroBlock({ hero }: BandejaHeroBlockProps) {
  return (
    <section className="flex flex-col gap-3 py-12 md:py-16">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE_OUT }}
        className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]"
      >
        {etiquetaSaludo(hero.saludo)}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.08 }}
        className="font-extrabold text-6xl text-text-primary leading-[0.95] tracking-tight md:text-7xl"
      >
        {hero.primerNombre}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.16 }}
        className="mt-2 text-base text-text-secondary md:text-lg"
      >
        {hero.subtitulo}
      </motion.p>
    </section>
  )
}
