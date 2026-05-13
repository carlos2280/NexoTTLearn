import { useKpisCursos } from "@/features/admin/dashboard/hooks/use-kpis-cursos"
import { Card } from "@/shared/components/ui/card"
import { Sparkline } from "@/shared/components/ui/sparkline"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import type { KpiPulso, TonoKpi } from "../inicio.types"

type DireccionDelta = "sube" | "baja" | "estable"

const TONO_DELTA: Record<DireccionDelta, TonoKpi> = {
  sube: "success",
  baja: "danger",
  estable: "acento",
}

const CHIP_ICONO_POR_TONO: Record<TonoKpi, string> = {
  acento: "bg-accent-soft text-accent-on-soft",
  success: "bg-success-soft text-success-on-soft",
  warning: "bg-warning-soft text-warning-on-soft",
  danger: "bg-danger-soft text-danger-on-soft",
}

function direccionDelta(delta: number): DireccionDelta {
  if (delta > 0) {
    return "sube"
  }
  if (delta < 0) {
    return "baja"
  }
  return "estable"
}

function formateaDelta(delta: number): string {
  if (delta === 0) {
    return "estable"
  }
  return delta > 0 ? `+${delta}` : `${delta}`
}

function DeltaChip({ delta }: { readonly delta: number }) {
  const direccion = direccionDelta(delta)
  const Icono = direccion === "sube" ? ArrowUpRight : direccion === "baja" ? ArrowDownRight : Minus
  const colorClase =
    direccion === "sube"
      ? "text-success-on-soft"
      : direccion === "baja"
        ? "text-danger-on-soft"
        : "text-text-tertiary"
  return (
    <span className={`tabular inline-flex items-center gap-0.5 text-caption ${colorClase}`}>
      <Icono className="h-3.5 w-3.5" strokeWidth={2} aria-hidden={true} />
      {formateaDelta(delta)}
    </span>
  )
}

interface PulsoKpiCardProps {
  readonly kpi: KpiPulso
  readonly indice: number
  readonly esHero: boolean
}

function PulsoKpiCard({ kpi, indice, esHero }: PulsoKpiCardProps) {
  const Icono = kpi.icono
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.1 + indice * 0.07
  const tieneSparkline = kpi.serie && kpi.serie.length >= 2
  const tieneDelta = kpi.delta !== undefined

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, delay, ease: EASE.default }}
    >
      <Card
        tono="plano"
        className="group hover:-translate-y-0.5 relative flex h-full flex-col gap-4 overflow-hidden transition-all duration-base ease-default hover:border-border-strong hover:shadow-sm"
        style={esHero ? { backgroundImage: "var(--gradient-card-acento)" } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2.5">
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${CHIP_ICONO_POR_TONO[kpi.tono]}`}
            >
              <Icono className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
            </span>
            <span className="nx-eyebrow text-text-secondary">{kpi.etiqueta}</span>
          </span>
          {tieneDelta ? <DeltaChip delta={kpi.delta ?? 0} /> : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <span className="tabular text-display-md text-text-primary leading-none tracking-tight">
            {kpi.valor.toLocaleString("es-ES")}
            {kpi.sufijo ? (
              <span className="ml-1 text-body text-text-tertiary">{kpi.sufijo}</span>
            ) : null}
          </span>
          {tieneSparkline && kpi.serie ? (
            <Sparkline
              puntos={kpi.serie}
              tono={TONO_DELTA[direccionDelta(kpi.delta ?? 0)]}
              ancho={88}
              alto={28}
            />
          ) : null}
        </div>

        <p className="text-caption text-text-tertiary">{kpi.nota}</p>
      </Card>
    </motion.div>
  )
}

export function PulsoKpis() {
  const { kpis, isLoading } = useKpisCursos()

  return (
    <section
      aria-label="Pulso del sistema"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {isLoading
        ? Array.from({ length: 4 }, (_, i) => (
            <Card key={`skeleton-${i + 1}`} tono="plano" className="h-[148px] animate-pulse" />
          ))
        : kpis.map((kpi, i) => <PulsoKpiCard key={kpi.id} kpi={kpi} indice={i} esHero={i === 0} />)}
    </section>
  )
}
