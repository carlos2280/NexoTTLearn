import { Button } from "@/shared/ui/primitives/button"
import type { BandejaSiguientePaso } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ArrowRight, PartyPopper } from "lucide-react"
import { CtaProximamente } from "./cta-proximamente"

interface EstadoCursoCompletadoBlockProps {
  readonly siguientePaso: BandejaSiguientePaso | null
  readonly onVolver: () => void
}

// §6.4 del doc canonico — ritual de cierre tras completar un curso.
// Reemplaza por una sesion el hero accionable. Animacion spring-dramatic
// 450ms al primer aterrizaje. "Ver expediente" queda deshabilitado hasta que
// /expediente exista; "Volver a la bandeja" descarta el estado celebratorio.
export function EstadoCursoCompletadoBlock({
  siguientePaso,
  onVolver,
}: EstadoCursoCompletadoBlockProps) {
  const titulo = siguientePaso?.titulo ?? "tu curso"

  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex justify-center py-6"
    >
      <div className="flex max-w-[520px] flex-col items-center gap-5 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] shadow-[0_8px_32px_rgb(124_58_237/0.4)]">
          <PartyPopper className="size-8 text-white" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-3xl text-text-primary tracking-tight">
            ¡Completaste el curso!
          </h2>
          <p className="text-base text-text-primary">"{titulo}"</p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Tu certificado quedó sellado en tu expediente.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <CtaProximamente variant="primary" size="md">
            Ver expediente
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </CtaProximamente>
          <Button type="button" variant="secondary" size="md" onClick={onVolver}>
            Volver a la bandeja
          </Button>
        </div>
      </div>
    </motion.section>
  )
}
