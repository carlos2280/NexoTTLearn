import { useKpisCursos } from "@/features/admin/dashboard/hooks/use-kpis-cursos"
import { KpiCard } from "@/shared/components/ui/kpi-card"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import type { KpiPulso, TonoKpi } from "../inicio.types"

const TONO_KPI_A_SPARKLINE: Record<TonoKpi, "acento" | "success" | "warning" | "danger"> = {
  acento: "acento",
  success: "success",
  warning: "warning",
  danger: "danger",
}

function tonoSparklinePorDelta(delta: number | undefined): "acento" | "success" | "danger" {
  if (delta === undefined || delta === 0) {
    return "acento"
  }
  return delta > 0 ? "success" : "danger"
}

interface PulsoKpiSlotProps {
  readonly kpi: KpiPulso
  readonly indice: number
  readonly esHero: boolean
}

function PulsoKpiSlot({ kpi, indice, esHero }: PulsoKpiSlotProps) {
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.08 + indice * 0.07
  const tono =
    kpi.delta !== undefined ? tonoSparklinePorDelta(kpi.delta) : TONO_KPI_A_SPARKLINE[kpi.tono]

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, delay, ease: EASE.default }}
      className="h-full"
    >
      <KpiCard
        variant={esHero ? "hero" : "compact"}
        eyebrow={kpi.etiqueta}
        value={kpi.valor}
        unit={kpi.sufijo}
        delta={kpi.delta}
        serie={kpi.serie}
        tono={tono}
        footer={kpi.nota}
        icon={kpi.icono}
        className="h-full"
      />
    </motion.div>
  )
}

function KpiSkeleton({ esHero }: { readonly esHero: boolean }) {
  return (
    <div
      className={
        esHero
          ? "h-[200px] animate-pulse rounded-2xl border border-accent/15 bg-accent-soft/40"
          : "h-[180px] animate-pulse rounded-2xl border border-border bg-subtle"
      }
    />
  )
}

export function PulsoKpis() {
  const { kpis, isLoading } = useKpisCursos()

  if (isLoading) {
    return (
      <section
        aria-label="Pulso del sistema"
        className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"
      >
        {Array.from({ length: 4 }, (_, i) => (
          <KpiSkeleton key={`skeleton-${i + 1}`} esHero={i === 0} />
        ))}
      </section>
    )
  }

  return (
    <section
      aria-label="Pulso del sistema"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"
    >
      {kpis.map((kpi, i) => (
        <PulsoKpiSlot key={kpi.id} kpi={kpi} indice={i} esHero={i === 0} />
      ))}
    </section>
  )
}
