import { Button } from "@/shared/components/ui/button"
import type { FichaSkillItem } from "@nexott-learn/shared-types"
import {
  etiquetaNivelSkill,
  nivelDeNotaSkill,
  origenNarrativo,
  relativizarFecha,
} from "../mi-ficha.helpers"

interface SkillDemostradaRowProps {
  readonly skill: FichaSkillItem
  readonly onVerHistorico: () => void
}

export function SkillDemostradaRow({ skill, onVerHistorico }: SkillDemostradaRowProps) {
  const nivel = nivelDeNotaSkill(skill.notaActual)
  const fechaRel = skill.fechaUltimoCambio ? relativizarFecha(skill.fechaUltimoCambio) : null
  const origen = origenNarrativo(skill.origenActual)

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium text-body text-text-primary">{skill.etiquetaVisible}</span>
        <span className="text-caption text-text-tertiary">
          {origen}
          {fechaRel ? (
            <>
              {" "}
              <span className="text-text-disabled">·</span> {fechaRel}
            </>
          ) : null}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium text-body-sm text-text-primary">
          {etiquetaNivelSkill(nivel)}
        </span>
        {skill.notaActual !== null ? (
          <span className="tabular font-mono text-caption text-text-tertiary">
            {skill.notaActual}
          </span>
        ) : null}
        <Button variant="link" size="sm" onClick={onVerHistorico}>
          Ver historico
        </Button>
      </div>
    </li>
  )
}
