import { KpiCard } from "@/shared/components/ui/kpi-card"
import type { InventarioSkillItem } from "@nexott-learn/shared-types"
import { Award, Layers, ShieldAlert } from "lucide-react"

interface InventarioKpisProps {
  readonly skills: readonly InventarioSkillItem[]
}

interface Totales {
  readonly skills: number
  readonly excelencia: number
  readonly solido: number
  readonly enDesarrollo: number
  readonly noCumple: number
  readonly skillsConBrechaCritica: number
}

function calcularTotales(skills: readonly InventarioSkillItem[]): Totales {
  const acc = skills.reduce(
    (a, s) => {
      const { excelencia, solido, enDesarrollo, noCumple } = s.porEtiquetaCualitativa
      const total = excelencia + solido + enDesarrollo + noCumple
      const tieneBrechaCritica = total > 0 && noCumple / total >= 0.2
      return {
        excelencia: a.excelencia + excelencia,
        solido: a.solido + solido,
        enDesarrollo: a.enDesarrollo + enDesarrollo,
        noCumple: a.noCumple + noCumple,
        skillsConBrechaCritica: a.skillsConBrechaCritica + (tieneBrechaCritica ? 1 : 0),
      }
    },
    {
      excelencia: 0,
      solido: 0,
      enDesarrollo: 0,
      noCumple: 0,
      skillsConBrechaCritica: 0,
    },
  )
  return { skills: skills.length, ...acc }
}

export function InventarioKpis({ skills }: InventarioKpisProps) {
  const t = calcularTotales(skills)
  const talentoCumbre = t.excelencia + t.solido
  const totalRegistros = talentoCumbre + t.enDesarrollo + t.noCumple
  const pctTalento = totalRegistros > 0 ? Math.round((talentoCumbre / totalRegistros) * 100) : null

  return (
    <section
      aria-label="Métricas cumbre"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]"
    >
      <KpiCard
        variant="hero"
        eyebrow="Skills inventariadas"
        value={t.skills}
        footer={`${totalRegistros} registros de competencia analizados`}
        icon={Layers}
      />

      <KpiCard
        variant="compact"
        eyebrow="Talento sólido o superior"
        value={pctTalento === null ? "—" : pctTalento}
        unit={pctTalento === null ? undefined : "%"}
        tono={
          pctTalento === null
            ? "acento"
            : pctTalento >= 60
              ? "success"
              : pctTalento >= 40
                ? "acento"
                : "warning"
        }
        footer={
          pctTalento === null
            ? "Sin registros todavía"
            : `${t.excelencia} excelencia · ${t.solido} sólido`
        }
        icon={Award}
      />

      <KpiCard
        variant="compact"
        eyebrow="Skills con brecha crítica"
        value={t.skillsConBrechaCritica}
        tono={t.skillsConBrechaCritica === 0 ? "success" : "danger"}
        footer={
          t.skillsConBrechaCritica === 0
            ? "Ninguna skill con ≥20% en no cumple"
            : `${t.noCumple} colaboradores en nivel no cumple`
        }
        icon={ShieldAlert}
      />
    </section>
  )
}
