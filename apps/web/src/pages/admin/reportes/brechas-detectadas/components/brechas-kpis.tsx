import { KpiCard } from "@/shared/components/ui/kpi-card"
import type { SkillBrechaItem } from "@nexott-learn/shared-types"
import { CheckCircle2, ListChecks, ShieldAlert } from "lucide-react"
import { totalSkill } from "../brechas-detectadas.types"

interface BrechasKpisProps {
  readonly skills: readonly SkillBrechaItem[]
}

function calcular(skills: readonly SkillBrechaItem[]) {
  const totales = skills.reduce(
    (a, s) => ({
      cumple: a.cumple + s.cumple,
      cerca: a.cerca + s.cerca,
      noCumple: a.noCumple + s.noCumple,
    }),
    { cumple: 0, cerca: 0, noCumple: 0 },
  )
  const totalRegistros = totales.cumple + totales.cerca + totales.noCumple
  const pctCobertura =
    totalRegistros > 0 ? Math.round((totales.cumple / totalRegistros) * 100) : null
  const skillsCriticas = skills.filter((s) => {
    const total = totalSkill(s)
    return total > 0 && s.noCumple / total >= 0.3
  }).length
  return { totales, pctCobertura, skillsCriticas }
}

export function BrechasKpis({ skills }: BrechasKpisProps) {
  const { totales, pctCobertura, skillsCriticas } = calcular(skills)

  return (
    <section
      aria-label="Métricas cumbre"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]"
    >
      <KpiCard
        variant="hero"
        eyebrow="Skills exigidas"
        value={skills.length}
        footer={`${totales.cumple + totales.cerca + totales.noCumple} registros de colaboradores analizados`}
        icon={ListChecks}
      />

      <KpiCard
        variant="compact"
        eyebrow="Cobertura"
        value={pctCobertura === null ? "—" : pctCobertura}
        unit={pctCobertura === null ? undefined : "%"}
        tono={
          pctCobertura === null
            ? "acento"
            : pctCobertura >= 70
              ? "success"
              : pctCobertura >= 40
                ? "acento"
                : "warning"
        }
        footer={
          pctCobertura === null
            ? "Sin datos todavía"
            : `${totales.cumple} cumplen · ${totales.cerca} cerca`
        }
        icon={CheckCircle2}
      />

      <KpiCard
        variant="compact"
        eyebrow="Skills críticas"
        value={skillsCriticas}
        tono={skillsCriticas === 0 ? "success" : "danger"}
        footer={
          skillsCriticas === 0
            ? "Ninguna skill con ≥30% en no cumple"
            : `${totales.noCumple} colaboradores en no cumple`
        }
        icon={ShieldAlert}
      />
    </section>
  )
}
