import { Card } from "@/shared/components/ui/card"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { Award, CheckCircle2, ClipboardCheck, type LucideIcon, Users } from "lucide-react"
import type { ResumenCursoKpis } from "../lib/resumen-curso.builder"

interface CursoResumenKpisProps {
  readonly kpis: ResumenCursoKpis
}

interface KpiSpec {
  readonly id: string
  readonly etiqueta: string
  readonly valor: string
  readonly nota: string
  readonly icono: LucideIcon
}

function formatearTasa(tasa: number | null): string {
  if (tasa === null) {
    return "—"
  }
  return `${Math.round(tasa * 100)}%`
}

function construirKpis(kpis: ResumenCursoKpis): readonly KpiSpec[] {
  return [
    {
      id: "total",
      etiqueta: "Asignados",
      valor: kpis.total.toLocaleString("es-ES"),
      nota:
        kpis.voluntarios > 0
          ? `${kpis.asignados} asignados · ${kpis.voluntarios} voluntarios`
          : `${kpis.asignados} asignados`,
      icono: Users,
    },
    {
      id: "activos",
      etiqueta: "En curso",
      valor: kpis.activos.toLocaleString("es-ES"),
      nota:
        kpis.total > 0
          ? `${Math.round((kpis.activos / kpis.total) * 100)}% del total`
          : "sin asignados",
      icono: ClipboardCheck,
    },
    {
      id: "listo",
      etiqueta: "Esperan veredicto",
      valor: kpis.listo.toLocaleString("es-ES"),
      nota: kpis.listo === 0 ? "ninguno pendiente" : "estado LISTO",
      icono: Award,
    },
    {
      id: "tasa-aptos",
      etiqueta: "Tasa APTO",
      valor: formatearTasa(kpis.tasaAptos),
      nota:
        kpis.aptos + kpis.noAptos === 0
          ? "sin cierres aún"
          : `${kpis.aptos} apto(s) · ${kpis.noAptos} no apto(s)`,
      icono: CheckCircle2,
    },
  ]
}

function KpiCard({ kpi, indice }: { readonly kpi: KpiSpec; readonly indice: number }) {
  const Icono = kpi.icono
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.05

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.page, delay, ease: EASE.default }}
    >
      <Card tono="plano" className="flex h-full flex-col gap-3">
        <span className="flex items-center gap-2 text-text-secondary">
          <Icono className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          <span className="nx-eyebrow">{kpi.etiqueta}</span>
        </span>
        <span className="tabular text-h1 text-text-primary leading-none">{kpi.valor}</span>
        <p className="text-caption text-text-tertiary">{kpi.nota}</p>
      </Card>
    </motion.div>
  )
}

export function CursoResumenKpis({ kpis }: CursoResumenKpisProps) {
  const items = construirKpis(kpis)
  return (
    <section
      aria-label="Indicadores del curso"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((kpi, i) => (
        <KpiCard key={kpi.id} kpi={kpi} indice={i} />
      ))}
    </section>
  )
}
