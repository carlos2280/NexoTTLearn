import type { GrupoArea } from "../mi-ficha.types"
import { FichaSkillRow } from "./ficha-skill-row"

interface FichaGrupoAreaProps {
  readonly grupo: GrupoArea
}

export function FichaGrupoArea({ grupo }: FichaGrupoAreaProps) {
  const tonoArea = `var(--color-area-${grupo.slug})`
  const sinSkills = grupo.skills.length === 0

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 border-border border-b pb-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-pill" style={{ background: tonoArea }} />
          <h2 className="nx-eyebrow text-text-secondary">{grupo.nombre}</h2>
        </div>
        <span className="tabular font-mono text-caption text-text-tertiary">
          {grupo.skillsConNota}
          <span className="text-text-disabled"> / </span>
          {grupo.skillsTotales} con nota
        </span>
      </header>

      {sinSkills ? (
        <p className="text-body-sm text-text-tertiary">No hay skills registradas en esta área.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {grupo.skills.map((skill) => (
            <FichaSkillRow key={skill.skillId} skill={skill} tonoArea={tonoArea} />
          ))}
        </ul>
      )}
    </section>
  )
}
