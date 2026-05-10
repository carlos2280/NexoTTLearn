import type { VistaCursoHitos } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { HitoCard } from "./hito-card"

interface VistaCursoHitosBlockProps {
  readonly hitos: VistaCursoHitos
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.4 hitos del curso (transversal + entrevista). Solo aparecen los activos.
export function VistaCursoHitosBlock({ hitos }: VistaCursoHitosBlockProps) {
  if (hitos.transversal === null && hitos.entrevista === null) {
    return null
  }
  return (
    <section className="flex flex-col gap-4">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.32 }}
        className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]"
      >
        Hitos del Curso
      </motion.p>
      <div className="flex flex-col gap-3">
        {hitos.transversal !== null ? <HitoCard hito={hitos.transversal} index={0} /> : null}
        {hitos.entrevista !== null ? <HitoCard hito={hitos.entrevista} index={1} /> : null}
      </div>
    </section>
  )
}
