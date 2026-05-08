import type { VistaArea } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { AreaSection } from "./area-section"

interface VistaCursoAreasProps {
  readonly areas: readonly VistaArea[]
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.3 modulos agrupados por area. Section label "Modulos del Curso" arriba.
export function VistaCursoAreas({ areas }: VistaCursoAreasProps) {
  if (areas.length === 0) {
    return null
  }
  let acc = 0
  return (
    <div className="flex flex-col gap-8">
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.12 }}
        className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]"
      >
        Modulos del Curso
      </motion.p>
      {areas.map((area) => {
        const startIndex = acc
        acc += area.modulos.length
        return <AreaSection key={area.id} area={area} startIndex={startIndex} />
      })}
    </div>
  )
}
