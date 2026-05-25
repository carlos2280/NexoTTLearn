import { slugArea } from "@/shared/lib/slug-area"
import type { AreaPorTrabajarCierre } from "@nexott-learn/shared-types"
import { motion, useReducedMotion } from "framer-motion"

interface AreasPorTrabajarProps {
  readonly areas: readonly AreaPorTrabajarCierre[]
}

const ETIQUETA_NIVEL: Record<AreaPorTrabajarCierre["nivelCualitativo"], string> = {
  enDesarrollo: "En desarrollo",
  inicial: "Inicial",
}

export function AreasPorTrabajar({ areas }: AreasPorTrabajarProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

  if (areas.length === 0) {
    return null
  }

  return (
    <motion.section
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3, duration: 0.7, ease }}
      className="flex flex-col items-center gap-4 text-center"
      aria-labelledby="areas-por-trabajar-titulo"
    >
      <p id="areas-por-trabajar-titulo" className="text-body text-text-secondary">
        Areas que necesitan mas practica:
      </p>

      <ul className="flex flex-col items-start gap-2.5">
        {areas.map((area, i) => (
          <motion.li
            key={area.areaId}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 + i * 0.08, duration: 0.5, ease }}
            className="flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="block h-2 w-2 shrink-0 rounded-full"
              style={{ background: `var(--color-area-${slugArea(area.areaNombre)})` }}
            />
            <span className="font-medium text-body text-text-primary">{area.areaNombre}</span>
            <span className="text-caption text-text-tertiary">
              {ETIQUETA_NIVEL[area.nivelCualitativo]}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  )
}
