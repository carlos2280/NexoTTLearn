import type { ConjuntoFilas } from "@/features/sql-ejecucion"

interface GrillaResultadosProps {
  readonly titulo: string
  readonly conjunto: ConjuntoFilas
  /** Color del texto del título (`var(--color-test-pass)` / `-fail`). */
  readonly colorTitulo: string
}

const MAX_FILAS = 8

/**
 * Pinta un conjunto de filas de SQL como una mini-tabla monoespaciada dentro de
 * la terminal del reto. Se usa para contrastar las filas obtenidas por el
 * alumno con las esperadas en los tests visibles que fallaron.
 */
export function GrillaResultados({ titulo, conjunto, colorTitulo }: GrillaResultadosProps) {
  const filasVisibles = conjunto.filas.slice(0, MAX_FILAS)
  const ocultas = conjunto.filas.length - filasVisibles.length
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: colorTitulo }}>
        {titulo}
      </span>
      {conjunto.columnas.length === 0 ? (
        <span style={{ color: "var(--color-code-line-number)" }}>(sin filas)</span>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse text-[11.5px]">
            <thead>
              <tr>
                {conjunto.columnas.map((col) => (
                  <th
                    key={col}
                    className="border border-white/10 px-2 py-0.5 text-left font-medium"
                    style={{ color: "var(--color-code-line-number)" }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasVisibles.map((fila, iFila) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: filas de resultado sin id estable; el orden es la identidad.
                <tr key={iFila}>
                  {fila.map((celda, iCelda) => (
                    <td
                      // biome-ignore lint/suspicious/noArrayIndexKey: celda posicional dentro de la fila.
                      key={iCelda}
                      className="border border-white/10 px-2 py-0.5 text-white/85"
                    >
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ocultas > 0 ? (
        <span style={{ color: "var(--color-code-line-number)" }}>+{ocultas} filas más…</span>
      ) : null}
    </div>
  )
}
