import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { useEffect, useId, useState } from "react"

interface CatalogoHeaderProps {
  readonly q: string
  readonly onChangeQ: (next: string) => void
  readonly totalDisponibles: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]
const DEBOUNCE_MS = 300

// §1 vitrina.md · header sticky 56px (desktop). Mantenemos el patron del
// header de mis-cursos pero con buscador inline (la vitrina lo necesita).
export function CatalogoHeader({ q, onChangeQ, totalDisponibles }: CatalogoHeaderProps) {
  const inputId = useId()
  const [local, setLocal] = useState(q)

  // Sincroniza si la URL cambia desde fuera (back/forward del navegador).
  useEffect(() => {
    setLocal(q)
  }, [q])

  // Debounce: actualiza la URL solo tras 300ms sin cambios.
  useEffect(() => {
    if (local === q) {
      return
    }
    const t = window.setTimeout(() => onChangeQ(local), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [local, q, onChangeQ])

  return (
    <section className="flex flex-col gap-4 py-12 md:flex-row md:items-end md:justify-between md:py-16">
      <div className="flex flex-col gap-2">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: EASE_OUT }}
          className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]"
        >
          Cursos disponibles
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.08 }}
          className="font-extrabold text-5xl text-text-primary leading-[0.95] tracking-tight md:text-6xl"
        >
          Catalogo
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.16 }}
          className="mt-1 text-base text-text-secondary md:text-lg"
        >
          {subtitulo(totalDisponibles)}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.24 }}
        className="relative md:w-80"
      >
        <label htmlFor={inputId} className="sr-only">
          Buscar cursos
        </label>
        <Search
          aria-hidden="true"
          strokeWidth={1.75}
          className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-text-muted"
        />
        <input
          id={inputId}
          type="search"
          value={local}
          onChange={(e) => setLocal(e.currentTarget.value)}
          placeholder="Buscar por titulo o descripcion..."
          className="w-full rounded-full border border-glass-border bg-surface-1 py-2.5 pr-4 pl-10 text-sm text-text-primary placeholder:text-text-muted focus:border-glass-border-strong focus:outline-none focus:ring-2 focus:ring-brand-violet/40"
        />
      </motion.div>
    </section>
  )
}

function subtitulo(total: number): string {
  if (total === 0) {
    return "Explora cursos libres y auto-inscribete"
  }
  if (total === 1) {
    return "1 curso disponible para inscribirte"
  }
  return `${total} cursos disponibles para inscribirte`
}
