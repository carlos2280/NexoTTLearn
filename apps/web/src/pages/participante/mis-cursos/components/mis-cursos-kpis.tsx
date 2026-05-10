import type { MisCursosKpis } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { BookOpen, CheckCircle2, type LucideIcon, Sparkles, Zap } from "lucide-react"

interface MisCursosKpisSectionProps {
  readonly kpis: MisCursosKpis
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

interface KpiDef {
  readonly label: string
  readonly icono: LucideIcon
  readonly valor: string
  readonly tono: "indigo" | "emerald" | "slate" | "spectral"
}

// §4.2 KPIs personales (no de negocio). Footer suave despues del grid:
// el participante los lee como espejo de su trabajo, no como peaje al inicio.
export function MisCursosKpisSection({ kpis }: MisCursosKpisSectionProps) {
  const items = construirKpis(kpis)
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.5 }}
      className="mt-12 border-glass-border border-t pt-8"
    >
      <p className="mb-4 font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]">
        Tu progreso
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
    </motion.section>
  )
}

function KpiCard({ kpi }: { readonly kpi: KpiDef }) {
  const Icono = kpi.icono
  return (
    <div className="group hover:-translate-y-[2px] relative overflow-hidden rounded-2xl border border-glass-border bg-surface-1 p-4 transition-all duration-300 hover:bg-surface-2">
      <div className={`mb-2 grid size-8 place-items-center rounded-lg ${tonoBg(kpi.tono)}`}>
        <Icono className={`size-4 ${tonoFg(kpi.tono)}`} strokeWidth={1.75} />
      </div>
      <p className="font-extrabold text-2xl text-text-primary tabular-nums">{kpi.valor}</p>
      <p className="font-medium text-[10.5px] text-text-muted uppercase tracking-[0.06em]">
        {kpi.label}
      </p>
    </div>
  )
}

function construirKpis(kpis: MisCursosKpis): readonly KpiDef[] {
  return [
    { label: "En curso", icono: Zap, valor: String(kpis.enCurso), tono: "indigo" },
    {
      label: "Completados",
      icono: CheckCircle2,
      valor: String(kpis.completados),
      tono: "emerald",
    },
    { label: "Total", icono: BookOpen, valor: String(kpis.total), tono: "slate" },
    {
      label: "Nota promedio",
      icono: Sparkles,
      valor: kpis.notaPromedio === null ? "—" : String(kpis.notaPromedio),
      tono: kpis.notaPromedio !== null && kpis.notaPromedio >= 90 ? "spectral" : "indigo",
    },
  ]
}

function tonoBg(tono: KpiDef["tono"]): string {
  switch (tono) {
    case "indigo":
      return "bg-brand-violet/12"
    case "emerald":
      return "bg-success/12"
    case "slate":
      return "bg-surface-2"
    case "spectral":
      return "bg-gradient-to-br from-brand-violet to-brand-cyan"
    default: {
      const _exhaustive: never = tono
      return _exhaustive
    }
  }
}

function tonoFg(tono: KpiDef["tono"]): string {
  switch (tono) {
    case "indigo":
      return "text-brand-violet-soft"
    case "emerald":
      return "text-success"
    case "slate":
      return "text-text-secondary"
    case "spectral":
      return "text-white"
    default: {
      const _exhaustive: never = tono
      return _exhaustive
    }
  }
}
