import type { SkillBrechaItem } from "@nexott-learn/shared-types"
import { NIVELES, type NivelBrecha, totalSkill } from "../brechas-detectadas.types"

interface BrechasSkillRowProps {
  readonly skill: SkillBrechaItem
}

export function BrechasSkillRow({ skill }: BrechasSkillRowProps) {
  const total = totalSkill(skill)
  const valores: Record<NivelBrecha, number> = {
    cumple: skill.cumple,
    cerca: skill.cerca,
    noCumple: skill.noCumple,
  }
  const pctNoCumple = total > 0 ? Math.round((skill.noCumple / total) * 100) : 0

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-base ease-default hover:border-border-strong hover:shadow-[var(--shadow-card-elevated)]">
      <header className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-body text-text-primary">{skill.etiqueta}</span>
        <span className="inline-flex items-baseline gap-1.5">
          <span className="tabular font-medium font-mono text-h3 text-text-primary">{total}</span>
          <span className="text-caption text-text-tertiary">colaboradores</span>
        </span>
      </header>

      <BarraApilada valores={valores} total={total} />

      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {NIVELES.map((n) => (
            <li key={n.id} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden={true}
                className="h-1.5 w-1.5 rounded-pill"
                style={{ background: n.tokenColor }}
              />
              <span className="text-caption text-text-tertiary">{n.etiqueta}</span>
              <span className="tabular font-medium font-mono text-caption text-text-secondary">
                {valores[n.id]}
              </span>
            </li>
          ))}
        </ul>
        {pctNoCumple > 0 && (
          <span
            className="tabular font-medium font-mono text-caption"
            style={{ color: "var(--color-state-no-apto)" }}
          >
            {pctNoCumple}% no cumple
          </span>
        )}
      </footer>
    </li>
  )
}

interface BarraApiladaProps {
  readonly valores: Record<NivelBrecha, number>
  readonly total: number
}

function BarraApilada({ valores, total }: BarraApiladaProps) {
  if (total === 0) {
    return <div className="h-2 w-full rounded-pill bg-subtle" aria-label="Sin registros" />
  }
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-pill bg-subtle"
      role="img"
      aria-label="Distribución de niveles"
    >
      {NIVELES.map((n) => {
        const valor = valores[n.id]
        if (valor === 0) {
          return null
        }
        const pct = (valor / total) * 100
        return (
          <span
            key={n.id}
            className="h-full"
            style={{ width: `${pct}%`, background: n.tokenColor }}
          />
        )
      })}
    </div>
  )
}
