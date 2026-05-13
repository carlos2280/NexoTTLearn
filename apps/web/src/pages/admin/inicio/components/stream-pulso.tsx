import { useAuditoriaReciente } from "@/features/admin/hooks/use-auditoria-reciente"
import { construirEventosPulso } from "@/features/admin/dashboard/lib/eventos-pulso.builder"
import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Section } from "@/shared/components/ui/section"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { Bell, CheckCircle2, GraduationCap, type LucideIcon, Sparkles, Users } from "lucide-react"
import { useMemo } from "react"
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

interface FilaEventoProps {
  readonly evento: EventoPulso
  readonly indice: number
  readonly esUltimo: boolean
  readonly esPrimero: boolean
}

function FilaEvento({ evento, indice, esUltimo, esPrimero }: FilaEventoProps) {
  const Icono = ICONO_POR_TIPO[evento.tipo]
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.04

  return (
    <motion.li
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: DUR.page, delay, ease: EASE.default }}
      className="relative flex items-start gap-3 px-3 py-3"
    >
      {esUltimo ? null : (
        <span aria-hidden={true} className="absolute top-10 bottom-0 left-[26px] w-px bg-border" />
      )}
      <span
        className={`relative z-10 mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-surface ${TONO_POR_TIPO[evento.tipo]}`}
      >
        <Icono className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={esPrimero ? "text-body text-text-primary" : "text-body-sm text-text-primary"}>
          <span className="font-medium">{evento.actor}</span>{" "}
          <span className="text-text-secondary">{evento.accion}</span>{" "}
          {evento.objeto ? <span className="text-text-secondary">{evento.objeto}</span> : null}
        </p>
        <span className="tabular text-caption text-text-tertiary">{evento.hace}</span>
      </div>
    </motion.li>
  )
}

function EstadoCargando() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={`skeleton-${i + 1}`} className="h-12 animate-pulse rounded-md bg-subtle" />
      ))}
    </div>
  )
}

function EstadoVacio() {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      <p className="text-body text-text-secondary">Sin actividad reciente.</p>
      <p className="text-caption text-text-tertiary">El día está tranquilo.</p>
    </div>
  )
}

function EstadoError({ onReintentar }: { readonly onReintentar: () => Promise<unknown> }) {
  return (
    <div className="p-4">
      <Banner tone="danger" title="No pudimos cargar la actividad reciente">
        <div className="flex flex-col gap-2">
          <span>Reintenta en un momento. Si persiste, revisa el estado del sistema.</span>
          <Button variant="ghost" size="sm" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      </Banner>
    </div>
  )
}

export function StreamPulso() {
  const { data, isLoading, error, refetch } = useAuditoriaReciente({
    limit: 10,
    refetchIntervalMs: 60_000,
  })
  const eventos = useMemo(() => construirEventosPulso(data?.data ?? []), [data])

  return (
    <Section
      id="stream-pulso"
      eyebrow="Pulso del sistema"
      titulo="Lo que ha pasado hoy"
      descripcion="Una línea de tiempo limpia. Nada más, nada menos."
    >
      <Card tono="plano" densidad="none">
        {error ? (
          <EstadoError onReintentar={refetch} />
        ) : isLoading ? (
          <EstadoCargando />
        ) : eventos.length === 0 ? (
          <EstadoVacio />
        ) : (
          <ul className="flex flex-col px-2 py-2">
            {eventos.map((evento, i) => (
              <FilaEvento
                key={evento.id}
                evento={evento}
                indice={i}
                esUltimo={i === eventos.length - 1}
                esPrimero={i === 0}
              />
            ))}
          </ul>
        )}
      </Card>
    </Section>
  )
}
