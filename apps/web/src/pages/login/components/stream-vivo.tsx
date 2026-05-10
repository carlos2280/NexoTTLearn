import { motion, useReducedMotion } from "framer-motion"
import { useMemo } from "react"

interface Linea {
  id: string
  delay: number
  duration: number
  angulo: number
  largo: number
  grosor: number
  opacidad: number
}

function generarLineas(cantidad: number, semilla: number): Linea[] {
  let s = semilla
  const rand = (): number => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const lineas: Linea[] = []
  for (let i = 0; i < cantidad; i++) {
    lineas.push({
      id: `linea-${semilla}-${i}`,
      delay: rand() * 4,
      duration: 2.4 + rand() * 2.6,
      angulo: rand() * Math.PI * 2,
      largo: 22 + rand() * 38,
      grosor: 0.5 + rand() * 1.2,
      opacidad: 0.18 + rand() * 0.42,
    })
  }
  return lineas
}

export function StreamVivo() {
  const reducedMotion = useReducedMotion()
  const lineas = useMemo(() => generarLineas(14, 42), [])

  if (reducedMotion) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="relative h-[1px] w-[1px]">
        {lineas.map((l) => {
          const x2 = Math.cos(l.angulo) * l.largo
          const y2 = Math.sin(l.angulo) * l.largo
          return (
            <motion.span
              key={l.id}
              className="absolute top-0 left-0 block origin-left rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(79,70,229,0) 0%, rgba(79,70,229,0.95) 35%, rgba(79,70,229,0) 100%)",
                width: `${l.largo}px`,
                height: `${l.grosor}px`,
                transform: `rotate(${(l.angulo * 180) / Math.PI}deg)`,
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{
                opacity: [0, l.opacidad, 0],
                scaleX: [0, 1, 1.15],
                x: [0, x2 * 0.06, x2 * 0.12],
                y: [0, y2 * 0.06, y2 * 0.12],
              }}
              transition={{
                duration: l.duration,
                delay: l.delay,
                repeat: Number.POSITIVE_INFINITY,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          )
        })}
        <motion.span
          className="-translate-x-1/2 -translate-y-1/2 absolute block h-2 w-2 rounded-full bg-[var(--color-accent)]"
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.55, 1, 0.55],
          }}
          transition={{
            duration: 2.6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>
    </div>
  )
}
