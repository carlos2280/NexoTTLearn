import { Card } from "@/shared/components/ui/card"
import type { SkillBrechaItem } from "@nexott-learn/shared-types"
import { porcentajeBrecha } from "../brechas-detectadas.types"
import { BrechasLeyenda } from "./brechas-leyenda"
import { BrechasSkillRow } from "./brechas-skill-row"

interface BrechasTablaProps {
  readonly skills: readonly SkillBrechaItem[]
}

export function BrechasTabla({ skills }: BrechasTablaProps) {
  if (skills.length === 0) {
    return (
      <Card tono="hueco" densidad="generosa">
        <p className="text-center text-body-sm text-text-secondary">
          Este curso no tiene skills exigidas configuradas.
        </p>
      </Card>
    )
  }

  // Skills con mayor brecha arriba — accionable.
  const ordenadas = [...skills].sort((a, b) => porcentajeBrecha(b) - porcentajeBrecha(a))

  return (
    <section aria-label="Brechas por skill" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Skill por skill</span>
          <h2 className="text-h3 text-text-primary">Brechas ordenadas por urgencia</h2>
        </div>
        <BrechasLeyenda />
      </header>

      <ul className="flex flex-col gap-3">
        {ordenadas.map((s) => (
          <BrechasSkillRow key={s.skillId} skill={s} />
        ))}
      </ul>
    </section>
  )
}
