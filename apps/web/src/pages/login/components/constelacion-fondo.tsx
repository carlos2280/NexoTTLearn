import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { useEffect, useMemo, useRef } from "react"

interface Punto {
  id: string
  x: number
  y: number
  r: number
  delay: number
}

interface Conexion {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  intensidad: number
}

function generarPuntos(cantidad: number, semilla: number): Punto[] {
  const puntos: Punto[] = []
  let s = semilla
  const rand = (): number => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let i = 0; i < cantidad; i++) {
    puntos.push({
      id: `s${semilla}p${i}`,
      x: rand() * 100,
      y: rand() * 100,
      r: rand() * 1.4 + 0.6,
      delay: rand() * 6,
    })
  }
  return puntos
}

/**
 * Red de skills · cada punto se conecta con sus k vecinos más cercanos.
 * Metáfora del producto: las habilidades del colaborador forman una red
 * que viaja con él, no con el curso.
 */
function generarConexiones(puntos: Punto[], k: number, distanciaMax: number): Conexion[] {
  const conexiones: Conexion[] = []
  const visto = new Set<string>()

  for (let i = 0; i < puntos.length; i++) {
    const p = puntos[i]
    if (!p) {
      continue
    }
    const distancias = puntos
      .map((q, j) => {
        if (j === i || !q) {
          return null
        }
        const dx = p.x - q.x
        const dy = p.y - q.y
        return { idx: j, q, dist: Math.sqrt(dx * dx + dy * dy) }
      })
      .filter((d): d is { idx: number; q: Punto; dist: number } => d !== null)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, k)

    for (const vecino of distancias) {
      if (vecino.dist > distanciaMax) {
        continue
      }
      const key = i < vecino.idx ? `${i}-${vecino.idx}` : `${vecino.idx}-${i}`
      if (visto.has(key)) {
        continue
      }
      visto.add(key)
      conexiones.push({
        id: `c-${key}`,
        x1: p.x,
        y1: p.y,
        x2: vecino.q.x,
        y2: vecino.q.y,
        intensidad: Math.max(0.04, 0.18 - vecino.dist * 0.006),
      })
    }
  }
  return conexiones
}

const FONDO_BASE =
  "radial-gradient(circle at 80% 15%, rgb(var(--color-accent-rgb) / 0.10), transparent 45%)," +
  "radial-gradient(circle at 15% 85%, rgb(var(--color-accent-rgb) / 0.08), transparent 45%)"

const FONDO_LUZ =
  "radial-gradient(circle at var(--lx) var(--ly), rgb(var(--color-accent-rgb) / 0.22), transparent 50%)"

const PUNTO_FILL = "rgb(var(--color-accent-rgb) / 0.55)"
const LINEA_STROKE = "rgb(var(--color-accent-rgb))"

export function ConstelacionFondo() {
  const reducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const sx = useSpring(mouseX, { stiffness: 60, damping: 22, mass: 0.6 })
  const sy = useSpring(mouseY, { stiffness: 60, damping: 22, mass: 0.6 })
  const lightX = useTransform(sx, (v) => `${v * 100}%`)
  const lightY = useTransform(sy, (v) => `${v * 100}%`)

  const puntos = useMemo(() => generarPuntos(42, 7), [])
  const conexiones = useMemo(() => generarConexiones(puntos, 2, 22), [puntos])

  useEffect(() => {
    if (reducedMotion) {
      return
    }
    const el = ref.current
    if (!el) {
      return
    }
    const handler = (e: PointerEvent): void => {
      const rect = el.getBoundingClientRect()
      mouseX.set((e.clientX - rect.left) / rect.width)
      mouseY.set((e.clientY - rect.top) / rect.height)
    }
    el.addEventListener("pointermove", handler)
    return () => el.removeEventListener("pointermove", handler)
  }, [mouseX, mouseY, reducedMotion])

  return (
    <div ref={ref} aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: FONDO_BASE }} />
      <motion.div
        className="-inset-[30%] absolute"
        style={{
          background: FONDO_LUZ,
          ["--lx" as string]: lightX,
          ["--ly" as string]: lightY,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <title>Red de habilidades</title>
        {conexiones.map((c, i) => (
          <motion.line
            key={c.id}
            x1={c.x1}
            y1={c.y1}
            x2={c.x2}
            y2={c.y2}
            stroke={LINEA_STROKE}
            strokeWidth={0.08}
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={
              reducedMotion
                ? { opacity: c.intensidad, pathLength: 1 }
                : {
                    opacity: [0, c.intensidad, c.intensidad * 0.6, c.intensidad],
                    pathLength: 1,
                  }
            }
            transition={{
              duration: reducedMotion ? 0.4 : 5 + (i % 4),
              delay: 0.3 + (i % 7) * 0.18,
              repeat: reducedMotion ? 0 : Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{ opacity: c.intensidad }}
          />
        ))}
        {puntos.map((p, i) => (
          <motion.circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.r * 0.22}
            fill={PUNTO_FILL}
            initial={{ opacity: 0.2 }}
            animate={reducedMotion ? { opacity: 0.5 } : { opacity: [0.25, 0.7, 0.25] }}
            transition={{
              duration: 4 + (i % 5),
              delay: p.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
      <div
        className="absolute inset-0"
        style={{
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          // biome-ignore lint/style/useNamingConvention: React requiere PascalCase para vendor prefix (WebkitFoo)
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }}
      />
    </div>
  )
}
