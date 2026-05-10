import { Button } from "@/shared/ui/primitives/button"
import { motion } from "framer-motion"
import { type RefObject, useEffect, useState } from "react"

interface FichaStickyCtaProps {
  readonly heroRef: RefObject<HTMLDivElement | null>
  readonly onInscribirse: () => void
  readonly cargando: boolean
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// F-01 ficha-curso-libre.md · sticky CTA bar al hacer scroll fuera del hero.
// Usa IntersectionObserver del hero (deja de estar visible -> aparece).
export function FichaStickyCta({ heroRef, onInscribirse, cargando }: FichaStickyCtaProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = heroRef.current
    if (!target) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) {
          setVisible(!entry.isIntersecting)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [heroRef])

  if (!visible) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[var(--z-sticky)] flex justify-center px-4 sm:bottom-28"
    >
      <div className="pointer-events-auto rounded-full border border-glass-border bg-surface-1/90 px-4 py-2 shadow-lg backdrop-blur">
        <Button onClick={onInscribirse} loading={cargando} variant="primary" size="md">
          Inscribirme gratis
        </Button>
      </div>
    </motion.div>
  )
}
