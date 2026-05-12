import { Card } from "@/shared/components/ui/card"
import { Sparkline } from "@/shared/components/ui/sparkline"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { MOCK_KPIS } from "../inicio.mock"
import type { KpiPulso, TonoKpi } from "../inicio.types"

const TONO_DELTA: Record<"sube" | "baja" | "estable", TonoKpi> = {
  sube: "success",
  baja: "danger",
  estable: "acento",
}

function direccionDelta(delta: number): "sube" | "baja" | "estable" {
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
  const signo = delta > 0 ? "+" : ""
  return `${signo}${delta}`
}

function PulsoKpiCard({ kpi, indice }: { readonly kpi: KpiPulso; readonly indice: number }) {
  const Icono = kpi.icono
  const direccion = direccionDelta(kpi.delta)
  const IconoDelta =
    direccion === "sube" ? ArrowUpRight : direccion === "baja" ? ArrowDownRight : Minus
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.1 + indice * 0.07

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, delay, ease: EASE.default }}
    >
      <Card tono="plano" className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <span className="flex items-center gap-2 text-text-secondary">
            <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            <span className="nx-eyebrow">{kpi.etiqueta}</span>
          </span>
          <span
            className={`tabular inline-flex items-center gap-0.5 text-caption ${
              direccion === "sube"
                ? "text-success-on-soft"
                : direccion === "baja"
                  ? "text-danger-on-soft"
                  : "text-text-tertiary"
            }`}
          >
            <IconoDelta className="h-3.5 w-3.5" strokeWidth={2} aria-hidden={true} />
            {formateaDelta(kpi.delta)}
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <span className="tabular text-h1 text-text-primary leading-none">
            {kpi.valor.toLocaleString("es-ES")}
            {kpi.sufijo ? (
              <span className="ml-1 text-body text-text-tertiary">{kpi.sufijo}</span>
            ) : null}
          </span>
          <Sparkline puntos={kpi.serie} tono={TONO_DELTA[direccion]} ancho={88} alto={28} />
        </div>

        <p className="text-caption text-text-tertiary">{kpi.nota}</p>
      </Card>
    </motion.div>
  )
}

export function PulsoKpis() {
  return (
    <section
      aria-label="Pulso del sistema"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {MOCK_KPIS.map((kpi, i) => (
        <PulsoKpiCard key={kpi.id} kpi={kpi} indice={i} />
      ))}
    </section>
  )
}
