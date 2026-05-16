interface Tramo {
  readonly id: string
  readonly valor: number
  readonly etiqueta: string
}

interface BarraSumaSegmentosProps {
  readonly tramos: readonly Tramo[]
  readonly objetivo?: number
}

/**
 * BarraSumaSegmentos — hairline horizontal que muestra cómo se reparte un
 * total entre N segmentos. Usa shades del accent (índigo) progresivos.
 *
 * Pensada para configuración: pesos del curso, capas del transversal,
 * cualquier distribución que deba sumar 100%. Microcopy debajo indica si
 * la suma es válida.
 */
export function BarraSumaSegmentos({ tramos, objetivo = 100 }: BarraSumaSegmentosProps) {
  const suma = tramos.reduce((acc, t) => acc + t.valor, 0)
  const sumaValida = Math.round(suma * 100) === Math.round(objetivo * 100)
  const total = suma > 0 ? suma : objetivo

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-1 w-full overflow-hidden rounded-pill bg-subtle">
        <div className="absolute inset-y-0 left-0 flex w-full">
          {tramos.map((t, i) => {
            const widthPct = (t.valor / total) * 100
            return (
              <span
                key={t.id}
                title={`${t.etiqueta}: ${t.valor}%`}
                style={{
                  width: `${widthPct}%`,
                  background: `rgb(var(--color-accent-rgb) / ${opacidadPorIndice(i)})`,
                }}
              />
            )
          })}
        </div>
      </div>
      <p
        className={
          sumaValida ? "text-caption text-text-tertiary" : "text-caption text-danger-on-soft"
        }
      >
        Suma: <span className="tabular font-medium">{suma.toFixed(0)}%</span>{" "}
        {sumaValida ? "✓" : `· debe ser ${objetivo}`}
      </p>
    </div>
  )
}

function opacidadPorIndice(i: number): number {
  const opacidades = [1, 0.7, 0.45, 0.3]
  return opacidades[i] ?? 0.25
}
