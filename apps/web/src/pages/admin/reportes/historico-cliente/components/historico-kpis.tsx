import { KpiCard } from "@/shared/components/ui/kpi-card"
import type { HistoricoClienteCursoItem } from "@nexott-learn/shared-types"
import { CheckCircle2, GraduationCap, Users } from "lucide-react"

interface HistoricoKpisProps {
  readonly cursos: readonly HistoricoClienteCursoItem[]
}

interface Totales {
  readonly presentados: number
  readonly aceptados: number
  readonly pctAceptacion: number | null
}

function calcularTotales(cursos: readonly HistoricoClienteCursoItem[]): Totales {
  const acc = cursos.reduce(
    (a, c) => ({
      presentados: a.presentados + c.presentados,
      aceptados: a.aceptados + c.aceptados,
    }),
    { presentados: 0, aceptados: 0 },
  )
  const pct = acc.presentados > 0 ? Math.round((acc.aceptados / acc.presentados) * 100) : null
  return { ...acc, pctAceptacion: pct }
}

export function HistoricoKpis({ cursos }: HistoricoKpisProps) {
  const t = calcularTotales(cursos)

  return (
    <section
      aria-label="Métricas cumbre"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]"
    >
      <KpiCard
        variant="hero"
        eyebrow="Cursos preparados"
        value={cursos.length}
        footer={`${t.presentados} colaboradores presentados · ${t.aceptados} aceptados`}
        icon={GraduationCap}
      />

      <KpiCard
        variant="compact"
        eyebrow="Aceptación global"
        value={t.pctAceptacion === null ? "—" : t.pctAceptacion}
        unit={t.pctAceptacion === null ? undefined : "%"}
        tono={
          t.pctAceptacion === null
            ? "acento"
            : t.pctAceptacion >= 70
              ? "success"
              : t.pctAceptacion >= 40
                ? "acento"
                : "warning"
        }
        footer={
          t.pctAceptacion === null
            ? "Sin presentaciones todavía"
            : `${t.aceptados} de ${t.presentados} aceptados`
        }
        icon={CheckCircle2}
      />

      <KpiCard
        variant="compact"
        eyebrow="Total presentados"
        value={t.presentados}
        footer={
          cursos.length > 0
            ? `Promedio ${Math.round(t.presentados / cursos.length)} por curso`
            : "Sin cursos"
        }
        icon={Users}
      />
    </section>
  )
}
