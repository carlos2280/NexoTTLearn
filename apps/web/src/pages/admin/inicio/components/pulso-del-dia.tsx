import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"

interface PulsoDelDiaProps {
  /** Valor 0-100. Salud del sistema. */
  readonly valor: number
  readonly etiqueta?: string
  readonly descripcion?: string
}

const ANILLO = {
  tamano: 156,
  grosor: 10,
}

export function PulsoDelDia({
  valor,
  etiqueta = "Pulso del día",
  descripcion = "Salud del sistema",
}: PulsoDelDiaProps) {
  const reduceMotion = useReducedMotion()
  const seguro = Math.max(0, Math.min(100, valor))
  const radio = (ANILLO.tamano - ANILLO.grosor) / 2
  const circunferencia = 2 * Math.PI * radio
  const offset = circunferencia - (seguro / 100) * circunferencia

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DUR.cinematic, delay: 0.1, ease: EASE.default }}
      role="img"
      aria-label={`${etiqueta}: ${seguro} de 100`}
      className="nx-grain relative isolate flex h-full min-h-[260px] items-center justify-center overflow-hidden rounded-2xl px-6 py-8"
      style={{ backgroundImage: "var(--gradient-pulso-card)" }}
    >
      <div className="flex flex-col items-center gap-5">
        <div
          className="relative inline-flex items-center justify-center"
          style={{ width: ANILLO.tamano, height: ANILLO.tamano }}
        >
          <svg
            width={ANILLO.tamano}
            height={ANILLO.tamano}
            viewBox={`0 0 ${ANILLO.tamano} ${ANILLO.tamano}`}
            className="-rotate-90"
            aria-hidden={true}
          >
            <circle
              cx={ANILLO.tamano / 2}
              cy={ANILLO.tamano / 2}
              r={radio}
              stroke="rgb(255 255 255 / 0.22)"
              strokeWidth={ANILLO.grosor}
              fill="none"
            />
            <motion.circle
              cx={ANILLO.tamano / 2}
              cy={ANILLO.tamano / 2}
              r={radio}
              stroke="rgb(255 255 255 / 0.95)"
              strokeWidth={ANILLO.grosor}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circunferencia}
              initial={
                reduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circunferencia }
              }
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: DUR.cinematic + DUR.storytelling, ease: EASE.default }}
            />
          </svg>
          <div className="absolute flex flex-col items-center text-surface">
            <span className="tabular text-display-md leading-none">{seguro}</span>
            <span className="nx-eyebrow mt-1 opacity-75">de 100</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center text-surface">
          <span className="nx-eyebrow opacity-80">{etiqueta}</span>
          <span className="font-serif text-body italic opacity-95">{descripcion}</span>
        </div>
      </div>
    </motion.div>
  )
}
