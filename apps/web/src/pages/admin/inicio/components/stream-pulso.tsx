import { Card } from "@/shared/components/ui/card"
import { Section } from "@/shared/components/ui/section"
import { motion, useReducedMotion } from "framer-motion"
import { Bell, CheckCircle2, GraduationCap, type LucideIcon, Sparkles, Users } from "lucide-react"
import { MOCK_PULSO } from "../inicio.mock"
import type { EventoPulso, TipoEvento } from "../inicio.types"

const ICONO_POR_TIPO: Record<TipoEvento, LucideIcon> = {
  publicacion: Sparkles,
  matricula: Users,
  evaluacion: CheckCircle2,
  sistema: GraduationCap,
  alerta: Bell,
}

const TONO_POR_TIPO: Record<TipoEvento, string> = {
  publicacion: "bg-accent-soft text-accent-on-soft",
  matricula: "bg-info-soft text-info-on-soft",
  evaluacion: "bg-success-soft text-success-on-soft",
  sistema: "bg-subtle text-text-secondary",
  alerta: "bg-warning-soft text-warning-on-soft",
}

function FilaEvento({ evento, indice }: { readonly evento: EventoPulso; readonly indice: number }) {
  const Icono = ICONO_POR_TIPO[evento.tipo]
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.04

  return (
    <motion.li
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 px-3 py-3"
    >
      <span
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${TONO_POR_TIPO[evento.tipo]}`}
      >
        <Icono className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-sm text-text-primary">
          <span className="font-medium">{evento.actor}</span>{" "}
          <span className="text-text-secondary">{evento.accion}</span> {evento.objeto}
        </p>
        <span className="tabular text-caption text-text-tertiary">{evento.hace}</span>
      </div>
    </motion.li>
  )
}

export function StreamPulso() {
  return (
    <Section
      id="stream-pulso"
      eyebrow="Pulso del sistema"
      titulo="Lo que ha pasado hoy"
      descripcion="Una línea de tiempo limpia. Nada más, nada menos."
    >
      <Card tono="plano" densidad="none">
        <ul className="flex flex-col divide-y divide-border">
          {MOCK_PULSO.map((evento, i) => (
            <FilaEvento key={evento.id} evento={evento} indice={i} />
          ))}
        </ul>
      </Card>
    </Section>
  )
}
