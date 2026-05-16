import { Button } from "@/shared/components/ui/button"
import { slugArea } from "@/shared/lib/slug-area"
import type { FichaPorAreaItem, FichaSkillItem } from "@nexott-learn/shared-types"
import { ChevronUp } from "lucide-react"
import { etiquetaNivelArea } from "../mi-ficha.helpers"
import { SkillDemostradaRow } from "./skill-demostrada-row"

interface DetalleAreaProps {
  readonly area: FichaPorAreaItem
  readonly skills: readonly FichaSkillItem[]
  readonly onCerrar: () => void
  readonly onAbrirHistorico: (skillId: string, skillNombre: string) => void
}

export function DetalleArea({ area, skills, onCerrar, onAbrirHistorico }: DetalleAreaProps) {
  const colorArea = `var(--color-area-${slugArea(area.nombre)})`
  const skillsDelArea = skills.filter((s) => s.areaId === area.areaId)
  const skillsDemostradasIds = new Set(skillsDelArea.map((s) => s.skillId))
  const porExplorar = (area.skillsCatalogo ?? []).filter(
    (s) => !skillsDemostradasIds.has(s.skillId),
  )
  const totalCatalogo = area.skillsCatalogo?.length ?? skillsDelArea.length
  const restantes = Math.max(0, totalCatalogo - skillsDelArea.length)
  const nivelArea = area.nivelCualitativo ?? "sinTocar"

  return (
    <section
      className="relative flex flex-col gap-6 overflow-hidden rounded-2xl border border-border bg-surface p-6"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
      aria-labelledby={`detalle-${area.areaId}`}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 right-0 left-0 h-[2px]"
        style={{ background: colorArea }}
      />

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="nx-eyebrow text-text-tertiary">{area.nombre}</span>
          <h3
            id={`detalle-${area.areaId}`}
            className="font-medium text-h3"
            style={{ color: colorArea }}
          >
            {etiquetaNivelArea(nivelArea)}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onCerrar} aria-label="Colapsar">
          <ChevronUp className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Colapsar
        </Button>
      </header>

      {skillsDelArea.length > 0 ? (
        <p className="text-body-sm text-text-secondary">
          Has demostrado{" "}
          <span className="font-medium text-text-primary">
            {skillsDelArea.length} {skillsDelArea.length === 1 ? "habilidad" : "habilidades"}
          </span>
          {restantes > 0 ? (
            <>
              . Te quedan <span className="font-medium text-text-primary">{restantes}</span> por
              explorar.
            </>
          ) : (
            "."
          )}
        </p>
      ) : (
        <p className="text-body-sm text-text-secondary">
          Aun no tienes evidencia en esta area. Hay{" "}
          <span className="font-medium text-text-primary">{totalCatalogo}</span> habilidades del
          catalogo esperando.
        </p>
      )}

      {skillsDelArea.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Demostradas</span>
          <ul className="flex flex-col divide-y divide-border">
            {skillsDelArea.map((skill) => (
              <SkillDemostradaRow
                key={skill.skillId}
                skill={skill}
                onVerHistorico={() => onAbrirHistorico(skill.skillId, skill.etiquetaVisible)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {porExplorar.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="nx-eyebrow text-text-tertiary">Por explorar</span>
          <ul className="flex flex-col divide-y divide-border">
            {porExplorar.map((skill) => (
              <li key={skill.skillId} className="flex items-center justify-between gap-3 py-3">
                <span className="text-body-sm text-text-secondary">{skill.etiquetaVisible}</span>
                <span className="text-caption text-text-tertiary">Aun no demostrada</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-caption text-text-tertiary">
            Estas capacidades existen en el catalogo y esperan tu primera evidencia.
          </p>
        </div>
      ) : null}
    </section>
  )
}
