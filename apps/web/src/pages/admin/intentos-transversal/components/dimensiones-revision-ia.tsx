import type { DimensionInforme } from "@nexott-learn/shared-types"

interface DimensionesRevisionIaProps {
  readonly dimensiones: readonly DimensionInforme[]
}

/**
 * Notas por dimensión del informe. Los ejes son las skills que el transversal
 * declara — puntuarlas hace comparables dos entregas. `null` = la IA no pudo
 * evaluar ese eje (se muestra "—", no 0).
 */
export function DimensionesRevisionIa({ dimensiones }: DimensionesRevisionIaProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="nx-eyebrow text-text-tertiary">Por dimensión</span>
      <ul className="flex flex-col divide-y divide-border">
        {dimensiones.map((d) => (
          <li key={d.dimension} className="flex items-baseline justify-between gap-4 py-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-body-sm text-text-primary">{d.dimension}</span>
              {d.comentario ? (
                <span className="text-caption text-text-tertiary">{d.comentario}</span>
              ) : null}
            </div>
            <span className="tabular shrink-0 text-body-sm text-text-secondary">
              {d.nota === null ? "—" : `${d.nota}/100`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
