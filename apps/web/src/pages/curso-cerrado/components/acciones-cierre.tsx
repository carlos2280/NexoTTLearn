import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { motion, useReducedMotion } from "framer-motion"
import { Link } from "react-router-dom"

interface AccionesCierreProps {
  readonly cursoId: string
}

export function AccionesCierre({ cursoId }: AccionesCierreProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.45, duration: 0.6, ease }}
      className="flex flex-col items-center gap-3 sm:flex-row"
    >
      <Button variant="primary" asChild={true}>
        <Link to={RUTAS.participante.miFicha}>Ver mi historia →</Link>
      </Button>
      <Button variant="ghost" asChild={true}>
        <Link to={RUTAS.participante.cursoDetalle(cursoId)}>Volver al curso →</Link>
      </Button>
    </motion.div>
  )
}
