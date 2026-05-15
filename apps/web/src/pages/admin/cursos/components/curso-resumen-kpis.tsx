import { KpiCard } from "@/shared/components/ui/kpi-card"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import type { ResumenCursoKpis } from "../lib/resumen-curso.builder"

interface CursoResumenKpisProps {
  readonly kpis: ResumenCursoKpis
}

interface KpiSpec {
  readonly id: string
  readonly etiqueta: string
  readonly valor: string
  readonly unidad?: string
  readonly nota: string
}

function formatearTasa(tasa: number | null): { readonly valor: string; readonly unidad?: string } {
  if (tasa === null) {
    return { valor: "—" }
  }
  return { valor: Math.round(tasa * 100).toString(), unidad: "%" }
}

function construirKpis(kpis: ResumenCursoKpis): readonly KpiSpec[] {
  const tasa = formatearTasa(kpis.tasaAptos)
  return [
    {
      id: "total",
      etiqueta: "Asignados",
      valor: kpis.total.toLocaleString("es-ES"),
      nota:
        kpis.voluntarios > 0
          ? `${kpis.asignados} asignados · ${kpis.voluntarios} voluntarios`
          : `${kpis.asignados} asignados`,
    },
    {
      id: "activos",
      etiqueta: "En curso",
      valor: kpis.activos.toLocaleString("es-ES"),
      nota:
        kpis.total > 0
          ? `${Math.round((kpis.activos / kpis.total) * 100)}% del total`
          : "sin asignados",
    },
    {
      id: "listo",
      etiqueta: "Esperan veredicto",
      valor: kpis.listo.toLocaleString("es-ES"),
      nota: kpis.listo === 0 ? "ninguno pendiente" : "estado LISTO",
    },
    {
      id: "tasa-aptos",
      etiqueta: "Tasa apto",
      valor: tasa.valor,
      unidad: tasa.unidad,
      nota:
        kpis.aptos + kpis.noAptos === 0
          ? "sin cierres aún"
          : `${kpis.aptos} apto(s) · ${kpis.noAptos} no apto(s)`,
    },
  ]
}

function KpiItem({ kpi, indice }: { readonly kpi: KpiSpec; readonly indice: number }) {
  const reduceMotion = useReducedMotion()
  const delay = reduceMotion ? 0 : 0.05 + indice * 0.05

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.page, delay, ease: EASE.default }}
      className="h-full"
    >
      <KpiCard
        eyebrow={kpi.etiqueta}
        value={kpi.valor}
        unit={kpi.unidad}
        footer={kpi.nota}
        className="h-full"
      />
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
        <KpiItem key={kpi.id} kpi={kpi} indice={i} />
      ))}
    </section>
  )
}
