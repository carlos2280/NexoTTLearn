import type { FichaSkillItem } from "@nexott-learn/shared-types"
import { etiquetaOrigen, tokenColorNota } from "../mi-ficha.types"

interface FichaSkillRowProps {
  readonly skill: FichaSkillItem
  readonly tonoArea: string
}

export function FichaSkillRow({ skill, tonoArea }: FichaSkillRowProps) {
  const nota = skill.notaActual
  const colorNota = tokenColorNota(nota)
  const sinNota = nota === null
  const pct = sinNota ? 0 : Math.max(0, Math.min(100, nota))

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-3 transition-colors duration-base ease-default hover:border-border-strong">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-body-sm text-text-primary">{skill.etiquetaVisible}</span>
        <span className="inline-flex items-baseline gap-1.5">
          {sinNota ? (
            <span className="text-caption text-text-tertiary">Sin nota</span>
          ) : (
            <>
              <span
                className="tabular font-medium font-mono text-body leading-none"
                style={{ color: colorNota }}
              >
                {Math.round(nota)}
              </span>
              <span className="text-caption text-text-tertiary">/ 100</span>
            </>
          )}
        </span>
      </div>

      <div
        className="h-1 w-full overflow-hidden rounded-pill bg-subtle"
        role="img"
        aria-label={sinNota ? "Sin nota" : `Nota ${Math.round(nota)}`}
      >
        {!sinNota && (
          <div
            className="h-full rounded-pill transition-all duration-slow ease-default"
            style={{ width: `${pct}%`, background: tonoArea }}
          />
        )}
      </div>

      <span className="text-caption text-text-tertiary">{etiquetaOrigen(skill.origenActual)}</span>
    </li>
  )
}
