import { PgSection } from "./pg-section"

interface SkillMock {
  readonly familia: string
  readonly detalle: string
  readonly area: string
  readonly nota: number | null
}

const SKILLS: readonly SkillMock[] = [
  { familia: "python", detalle: "basico", area: "backend", nota: 92 },
  { familia: "python", detalle: "pandas", area: "data", nota: 78 },
  { familia: "python", detalle: "fastapi", area: "backend", nota: 65 },
  { familia: "python", detalle: "pyspark", area: "data", nota: 42 },
  { familia: "react", detalle: "basico", area: "frontend", nota: 88 },
  { familia: "react", detalle: "hooks", area: "frontend", nota: 71 },
  { familia: "typescript", detalle: "basico", area: "frontend", nota: 85 },
  { familia: "azure", detalle: "basico", area: "cloud", nota: 58 },
  { familia: "azure", detalle: "databricks", area: "cloud", nota: null },
  { familia: "git", detalle: "avanzado", area: "devops", nota: 80 },
  { familia: "soft", detalle: "comunicacion", area: "soft", nota: 68 },
  { familia: "soft", detalle: "presentaciones", area: "soft", nota: null },
]

export function PgSkillChips() {
  return (
    <PgSection
      eyebrow="Componentes · Vocabulario"
      titulo="Skill chips"
      descripcion="El idioma común del sistema. Familia tenue + detalle fuerte, en mono. Tinta del área a la que pertenece la skill."
    >
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <SkillChip key={`${s.familia}.${s.detalle}`} skill={s} />
          ))}
        </div>
        <div className="flex flex-col gap-2 border-border border-t pt-5">
          <span className="nx-eyebrow text-text-tertiary">Variante · con nota</span>
          <div className="flex flex-wrap gap-2">
            {SKILLS.filter((s) => s.nota !== null)
              .slice(0, 8)
              .map((s) => (
                <SkillChipConNota key={`n-${s.familia}.${s.detalle}`} skill={s} />
              ))}
          </div>
        </div>
      </div>
    </PgSection>
  )
}

function SkillChip({ skill }: { skill: SkillMock }) {
  return (
    <span
      className="hover:-translate-y-px inline-flex items-center rounded-pill border bg-surface px-2.5 py-1 font-mono text-[11px] transition-all duration-fast ease-out"
      style={{
        borderColor: `rgb(var(--color-area-${skill.area}-rgb) / 0.3)`,
        color: `var(--color-area-${skill.area}-on-soft)`,
      }}
    >
      <span className="opacity-60">{skill.familia}.</span>
      <span className="font-semibold">{skill.detalle}</span>
    </span>
  )
}

function SkillChipConNota({ skill }: { skill: SkillMock }) {
  if (skill.nota === null) {
    return null
  }
  const estado = estadoPorNota(skill.nota)
  return (
    <span
      className="inline-flex items-center gap-2 rounded-pill border px-2 py-1 font-mono text-[11px]"
      style={{
        borderColor: `rgb(var(--color-area-${skill.area}-rgb) / 0.3)`,
        background: `var(--color-area-${skill.area}-soft)`,
      }}
    >
      <span style={{ color: `var(--color-area-${skill.area}-on-soft)` }}>
        <span className="opacity-60">{skill.familia}.</span>
        <span className="font-semibold">{skill.detalle}</span>
      </span>
      <span
        className="tabular border-l pl-2 font-semibold"
        style={{
          borderColor: `rgb(var(--color-area-${skill.area}-rgb) / 0.25)`,
          color: `var(--color-state-${estado}-on-soft)`,
        }}
      >
        {skill.nota}
      </span>
    </span>
  )
}

function estadoPorNota(nota: number): string {
  if (nota >= 80) {
    return "solido"
  }
  if (nota >= 60) {
    return "en-desarrollo"
  }
  return "no-apto"
}
