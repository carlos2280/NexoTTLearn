import { Field } from "@/shared/components/ui/field"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type { AreaResponse, SkillResponse } from "@nexott-learn/shared-types"
import { ArrowRight } from "lucide-react"

interface SkillsAreaSelectorProps {
  readonly skill: SkillResponse | null
  readonly areas: readonly AreaResponse[]
  readonly areaDestinoId: string
  readonly onCambiarDestino: (id: string) => void
}

function nombreArea(areas: readonly AreaResponse[], id: string): string {
  return areas.find((a) => a.id === id)?.nombre ?? "—"
}

export function SkillsAreaSelector({
  skill,
  areas,
  areaDestinoId,
  onCambiarDestino,
}: SkillsAreaSelectorProps) {
  return (
    <div className="flex items-end gap-3">
      <Field label="Área actual">
        {() => (
          <div className="flex h-12 w-full items-center rounded-md border border-border bg-subtle px-3 text-input text-text-secondary">
            {skill ? nombreArea(areas, skill.areaId) : "—"}
          </div>
        )}
      </Field>
      <ArrowRight
        className="mb-3 h-5 w-5 shrink-0 text-text-tertiary"
        strokeWidth={1.5}
        aria-hidden={true}
      />
      <Field label="Área destino">
        {(p) => (
          <Select {...p} value={areaDestinoId} onValueChange={onCambiarDestino}>
            {areas.map((a) => (
              <SelectItem key={a.id} value={a.id} disabled={a.id === skill?.areaId}>
                {a.nombre}
                {a.id === skill?.areaId ? " (actual)" : ""}
              </SelectItem>
            ))}
          </Select>
        )}
      </Field>
    </div>
  )
}
