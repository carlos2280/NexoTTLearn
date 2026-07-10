import { useListarAreas } from "@/features/catalogo/hooks/use-listar-areas"
import { useListarSkills } from "@/features/catalogo/hooks/use-listar-skills"
import { Button } from "@/shared/components/ui/button"
import { SkillChip } from "@/shared/components/ui/skill-chip"
import { slugArea } from "@/shared/lib/slug-area"
import type { AreaResponse, SkillResponse } from "@nexott-learn/shared-types"
import { X } from "lucide-react"
import { useMemo } from "react"
import { SelectorPopover } from "./selector-popover"

interface SelectorSkillsTransversalProps {
  readonly skillsIds: readonly string[]
  readonly onCambio: (ids: readonly string[]) => void
}

/**
 * Selector de las skills que el proyecto transversal mide (integradoras). Solo
 * gestiona la lista de ids; la nota se evalúa en las 3 capas, no por skill.
 */
export function SelectorSkillsTransversal({ skillsIds, onCambio }: SelectorSkillsTransversalProps) {
  const skillsCatalogo = useListarSkills({ page: 1, pageSize: 100, estado: "ACTIVA" })
  const areasCatalogo = useListarAreas({ page: 1, pageSize: 100 })

  const catalogo = useMemo(() => skillsCatalogo.data?.data ?? [], [skillsCatalogo.data])
  const indiceArea = useMemo(() => {
    const map = new Map<string, AreaResponse>()
    for (const a of areasCatalogo.data?.data ?? []) {
      map.set(a.id, a)
    }
    return map
  }, [areasCatalogo.data])

  const areaDe = (skill: SkillResponse | undefined) =>
    slugArea(skill ? indiceArea.get(skill.areaId)?.nombre : undefined)

  const seleccionadas = skillsIds
    .map((id) => catalogo.find((s) => s.id === id))
    .filter((s): s is SkillResponse => s !== undefined)
  const disponibles = catalogo.filter((s) => !skillsIds.includes(s.id))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="nx-eyebrow text-text-tertiary">Skills que mide</span>
        <SelectorPopover<SkillResponse>
          disponibles={disponibles}
          obtenerId={(s) => s.id}
          obtenerEtiqueta={(s) => s.etiquetaVisible}
          renderItem={(s) => (
            <>
              <SkillChip etiqueta={s.etiquetaVisible} area={areaDe(s)} size="sm" />
              <span className="ml-auto font-mono text-[10px] text-text-tertiary">{areaDe(s)}</span>
            </>
          )}
          onSeleccionar={(id) => onCambio([...skillsIds, id])}
          triggerLabel="Añadir skill"
          buscable={true}
          placeholderBusqueda="Buscar skill por nombre…"
          emptyMessage="No hay skills que coincidan"
        />
      </div>

      {seleccionadas.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">
          Aún no hay skills. El transversal se evalúa igual, pero sin skills integradoras asociadas.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {seleccionadas.map((skill) => (
            <li key={skill.id} className="inline-flex items-center gap-1">
              <SkillChip etiqueta={skill.etiquetaVisible} area={areaDe(skill)} size="sm" />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onCambio(skillsIds.filter((id) => id !== skill.id))}
                aria-label={`Quitar ${skill.etiquetaVisible}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
