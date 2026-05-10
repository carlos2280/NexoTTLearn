import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { useEffect, useMemo, useRef } from "react"

interface Punto {
  id: string
  x: number
  y: number
  r: number
  delay: number
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

export function ConstelacionFondo() {
  const reducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement | null>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const sx = useSpring(mouseX, { stiffness: 60, damping: 22, mass: 0.6 })
  const sy = useSpring(mouseY, { stiffness: 60, damping: 22, mass: 0.6 })
  const lightX = useTransform(sx, (v) => `${v * 100}%`)
  const lightY = useTransform(sy, (v) => `${v * 100}%`)

  const puntos = useMemo(() => generarPuntos(52, 7), [])

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
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 80% 15%, rgba(79,70,229,0.10), transparent 45%)," +
            "radial-gradient(circle at 15% 85%, rgba(79,70,229,0.08), transparent 45%)",
        }}
      />
      <motion.div
        className="-inset-[30%] absolute"
        style={{
          background:
            "radial-gradient(circle at var(--lx) var(--ly), rgba(79,70,229,0.22), transparent 50%)",
          ["--lx" as string]: lightX,
          ["--ly" as string]: lightY,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <title>Constelación de marca</title>
        {puntos.map((p, i) => (
          <motion.circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.r * 0.18}
            fill="rgba(79,70,229,0.55)"
            initial={{ opacity: 0.2 }}
            animate={reducedMotion ? { opacity: 0.4 } : { opacity: [0.2, 0.6, 0.2] }}
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
