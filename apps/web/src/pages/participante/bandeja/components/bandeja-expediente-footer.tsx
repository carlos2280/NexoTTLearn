import { RUTAS } from "@/shared/constants/rutas"
import { Button } from "@/shared/ui/primitives/button"
import type { BandejaExpedienteResumen } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

interface BandejaExpedienteFooterProps {
  readonly expediente: BandejaExpedienteResumen
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.4 doc canonico. Bloque suave al final, antes del dock. Section label +
// resumen + CTA ghost a /expediente.
export function BandejaExpedienteFooter({ expediente }: BandejaExpedienteFooterProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.6 }}
      className="mt-12 border-glass-border border-t pt-6"
    >
      <p className="mb-3 font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]">
        Mi expediente
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">{expediente.resumen}</p>
        <Button asChild={true} variant="ghost" size="sm">
          <Link to={RUTAS.participante.expediente}>
            Ver expediente
            <ChevronRight className="size-4" strokeWidth={2} />
          </Link>
        </Button>
      </div>
    </motion.section>
  )
}
