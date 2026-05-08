import type { MisCursosResumen } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"

interface MisCursosHeaderProps {
  readonly resumen: MisCursosResumen
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.1 doc canonico. Titulo "Mis Cursos" 36px + subtitulo contextual.
export function MisCursosHeader({ resumen }: MisCursosHeaderProps) {
  return (
    <section className="flex flex-col gap-2 py-12 md:py-16">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE_OUT }}
        className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]"
      >
        Tu ruta
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.08 }}
        className="font-extrabold text-5xl text-text-primary leading-[0.95] tracking-tight md:text-6xl"
      >
        Mis Cursos
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.16 }}
        className="mt-1 text-base text-text-secondary md:text-lg"
      >
        {subtitulo(resumen)}
      </motion.p>
    </section>
  )
}

function subtitulo(resumen: MisCursosResumen): string {
  if (resumen.activos === 0 && resumen.completados === 0) {
    return "Aun no estas inscrito en ningun curso"
  }
  if (resumen.activos === 0 && resumen.completados >= 1) {
    return "Todos tus cursos estan en tu expediente"
  }
  if (resumen.activos === 1) {
    return "Tu ruta de aprendizaje — 1 curso activo"
  }
  return `Tu ruta de aprendizaje — ${resumen.activos} cursos activos`
}
