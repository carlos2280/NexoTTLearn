import { Badge } from "@/shared/components/ui/badge"
import type { AreaResponse, SkillResponse } from "@nexott-learn/shared-types"

interface SkillsResumenProps {
  readonly skill: SkillResponse | undefined
  readonly areas: readonly AreaResponse[]
  readonly etiqueta: string
}

function nombreArea(areas: readonly AreaResponse[], id: string): string {
  return areas.find((a) => a.id === id)?.nombre ?? "—"
}

export function SkillsResumen({ skill, areas, etiqueta }: SkillsResumenProps) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-subtle/40 px-4 py-3">
      <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
      {skill ? (
        <>
          <span className="font-medium text-body text-text-primary">{skill.etiquetaVisible}</span>
          <Badge tono="contorno">Área: {nombreArea(areas, skill.areaId)}</Badge>
        </>
      ) : (
        <span className="text-body-sm text-text-tertiary">Selecciona una skill…</span>
      )}
    </div>
  )
}
