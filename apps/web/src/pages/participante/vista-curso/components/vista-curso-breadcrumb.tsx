import { RUTAS } from "@/shared/constants/rutas"
import { motion } from "framer-motion"
import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface VistaCursoBreadcrumbProps {
  readonly tituloCurso: string
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.1 doc canonico. Breadcrumb: ◀ Mis Cursos · {titulo}
export function VistaCursoBreadcrumb({ tituloCurso }: VistaCursoBreadcrumbProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      aria-label="Migas de pan"
      className="flex items-center gap-1.5 text-[13px] text-text-muted"
    >
      <Link
        to={RUTAS.participante.misCursos}
        className="inline-flex items-center gap-1 text-brand-violet-soft transition-colors hover:text-brand-violet"
      >
        <ChevronLeft className="size-3.5" strokeWidth={2} />
        Mis Cursos
      </Link>
      <span aria-hidden="true">·</span>
      <span className="truncate text-text-secondary">{tituloCurso}</span>
    </motion.nav>
  )
}
