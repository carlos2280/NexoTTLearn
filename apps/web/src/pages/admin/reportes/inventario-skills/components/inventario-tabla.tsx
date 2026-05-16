import { Card } from "@/shared/components/ui/card"
import type { InventarioSkillItem } from "@nexott-learn/shared-types"
import { InventarioLeyenda } from "./inventario-leyenda"
import { InventarioSkillRow } from "./inventario-skill-row"

interface InventarioTablaProps {
  readonly skills: readonly InventarioSkillItem[]
}

export function InventarioTabla({ skills }: InventarioTablaProps) {
  if (skills.length === 0) {
    return (
      <Card tono="hueco" densidad="generosa">
        <p className="text-center text-body-sm text-text-secondary">
          No hay skills inventariadas con los filtros actuales.
        </p>
      </Card>
    )
  }

  const skillsOrdenadas = [...skills].sort((a, b) => b.totalColaboradores - a.totalColaboradores)

  return (
    <section aria-label="Inventario por skill" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Distribución por nivel</span>
          <h2 className="text-h3 text-text-primary">Skill por skill</h2>
        </div>
        <InventarioLeyenda />
      </header>

      <ul className="flex flex-col gap-3">
        {skillsOrdenadas.map((s) => (
          <InventarioSkillRow key={s.skillId} skill={s} />
        ))}
      </ul>
    </section>
  )
}
