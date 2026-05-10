import { labelNivel } from "@/pages/participante/mis-cursos/components/curso-presets"
import type { VistaCursoHero } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { VistaCursoHeroArt } from "./vista-curso-hero-art"
import { VistaCursoHeroCta } from "./vista-curso-hero-cta"
import { VistaCursoHeroKpis } from "./vista-curso-hero-kpis"
import { VistaCursoHeroMeta } from "./vista-curso-hero-meta"
import { VistaCursoProgreso } from "./vista-curso-progreso"

interface VistaCursoHeroBlockProps {
  readonly hero: VistaCursoHero
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.2 hero del curso. Grid 2 columnas (art 240 + body flex 1) en desktop;
// apilado en mobile. Reflejo superior + ghost border + sombra.
export function VistaCursoHeroBlock({ hero }: VistaCursoHeroBlockProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_OUT, delay: 0.08 }}
      className="relative overflow-hidden rounded-3xl border border-glass-border bg-surface-1 p-6 shadow-md md:p-8"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <VistaCursoHeroArt gradiente={hero.gradiente} icono={hero.icono} />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <VistaCursoHeroMeta hero={hero} nivelLabel={labelNivel(hero.nivel)} />
          <VistaCursoProgreso porcentaje={hero.porcentajeProgreso} excelencia={hero.excelencia} />
          <VistaCursoHeroKpis kpis={hero.kpis} />
          <VistaCursoHeroCta siguientePaso={hero.siguientePaso} />
        </div>
      </div>
    </motion.section>
  )
}
