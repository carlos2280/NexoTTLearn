import { Card } from "@/shared/components/ui/card"
import type { FichaRelevanteItem } from "@nexott-learn/shared-types"
import { etiquetaOrigen, tokenPorNota } from "../detalle-colaborador.types"

interface DetalleSkillsProps {
  readonly fichaRelevante: readonly FichaRelevanteItem[]
}

export function DetalleSkills({ fichaRelevante }: DetalleSkillsProps) {
  return (
    <Card tono="plano" densidad="generosa" className="flex h-full flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Ficha relevante</span>
        <h2 className="text-h3 text-text-primary">Skills exigidas por el curso</h2>
      </header>

      {fichaRelevante.length === 0 ? (
        <p className="text-body-sm text-text-secondary">
          Aún no hay skills evaluadas para este colaborador en el curso.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {fichaRelevante.map((item) => (
            <SkillRow key={item.skillId} item={item} />
          ))}
        </ul>
      )}
    </Card>
  )
}

interface SkillRowProps {
  readonly item: FichaRelevanteItem
}

function SkillRow({ item }: SkillRowProps) {
  const nota = item.notaActual
  const color = tokenPorNota(nota)
  const pct = nota === null ? 0 : Math.max(0, Math.min(100, nota))

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-body-sm text-text-primary">{item.etiqueta}</span>
        <span className="inline-flex items-baseline gap-1.5">
          {nota === null ? (
            <span className="text-caption text-text-tertiary">Sin nota</span>
          ) : (
            <>
              <span className="tabular font-medium font-mono text-body" style={{ color }}>
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
        aria-label={nota === null ? "Sin nota" : `Nota ${Math.round(nota)}`}
      >
        {nota !== null && (
          <div
            className="h-full rounded-pill transition-all duration-base ease-default"
            style={{ width: `${pct}%`, background: color }}
          />
        )}
      </div>

      <span className="text-caption text-text-tertiary">{etiquetaOrigen(item.origen)}</span>
    </li>
  )
}
