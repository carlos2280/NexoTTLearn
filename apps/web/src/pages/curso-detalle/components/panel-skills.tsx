import { cn } from "@/shared/lib/cn"
import type { ClaseColorSkill, MeAvancePorSkill } from "@nexott-learn/shared-types"

interface PanelSkillsProps {
  readonly skills: readonly MeAvancePorSkill[]
}

/**
 * Doc §5.4 — el participante ve etiqueta CUMPLE/CERCA/NO_CUMPLE/SIN_EVIDENCIA
 * pero NO los números de nota. Los números aparecen al cierre, en Mi ficha.
 */

interface EtiquetaSkill {
  readonly texto: string
  readonly clase: string
}

const ETIQUETAS_POR_COLOR: Record<ClaseColorSkill, EtiquetaSkill> = {
  verde: { texto: "CUMPLE", clase: "text-success" },
  amarillo: { texto: "CERCA", clase: "text-warmth" },
  rojo: { texto: "NO CUMPLE", clase: "text-danger" },
}

const ETIQUETA_SIN_EVIDENCIA: EtiquetaSkill = {
  texto: "SIN EVIDENCIA",
  clase: "text-text-tertiary",
}

function obtenerEtiqueta(skill: MeAvancePorSkill): EtiquetaSkill {
  if (skill.notaActual === null) {
    return ETIQUETA_SIN_EVIDENCIA
  }
  return ETIQUETAS_POR_COLOR[skill.claseColor]
}

export function PanelSkills({ skills }: PanelSkillsProps) {
  if (skills.length === 0) {
    return null
  }
  return (
    <section aria-labelledby="panel-skills-titulo" className="flex flex-col gap-3">
      <h2 id="panel-skills-titulo" className="text-h3 text-text-primary">
        Tu avance por skill
      </h2>
      <ul className="flex flex-col gap-1.5">
        {skills.map((skill) => {
          const etiqueta = obtenerEtiqueta(skill)
          return (
            <li
              key={skill.skillId}
              className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2"
            >
              <span className="truncate text-body-sm text-text-primary">{skill.etiqueta}</span>
              <span className={cn("shrink-0 font-medium text-caption", etiqueta.clase)}>
                {etiqueta.texto}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
