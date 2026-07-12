import type { PuntoAReforzar } from "@nexott-learn/shared-types"

interface ListasRevisionIaProps {
  readonly fortalezas: readonly string[]
  readonly aReforzar: readonly PuntoAReforzar[]
}

/**
 * Dos columnas del informe: fortalezas (con evidencia) y puntos a reforzar
 * (qué + sugerencia accionable). Si ambas vienen vacías, no renderiza nada.
 */
export function ListasRevisionIa({ fortalezas, aReforzar }: ListasRevisionIaProps) {
  if (fortalezas.length === 0 && aReforzar.length === 0) {
    return null
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Fortalezas</span>
        {fortalezas.length === 0 ? (
          <span className="text-body-sm text-text-tertiary">—</span>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {fortalezas.map((f, i) => (
              <li key={`${i}-${f}`} className="text-body-sm text-text-secondary">
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Por reforzar</span>
        {aReforzar.length === 0 ? (
          <span className="text-body-sm text-text-tertiary">—</span>
        ) : (
          <ul className="flex flex-col gap-2">
            {aReforzar.map((r, i) => (
              <li key={`${i}-${r.que}`} className="flex flex-col">
                <span className="text-body-sm text-text-primary">{r.que}</span>
                <span className="text-caption text-text-tertiary">{r.sugerencia}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
