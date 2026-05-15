import { Card } from "@/shared/components/ui/card"
import type { EficaciaPlataformaAptos } from "@nexott-learn/shared-types"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

interface EficaciaAptosDonutProps {
  readonly aptos: EficaciaPlataformaAptos
}

interface Segmento {
  readonly clave: "pasaron" | "noPasaron" | "pendientes"
  readonly etiqueta: string
  readonly valor: number
  readonly color: string
}

function construirSegmentos(aptos: EficaciaPlataformaAptos): readonly Segmento[] {
  return [
    {
      clave: "pasaron",
      etiqueta: "Pasaron",
      valor: aptos.pasaron,
      color: "var(--color-success)",
    },
    {
      clave: "noPasaron",
      etiqueta: "No pasaron",
      valor: aptos.noPasaron,
      color: "var(--color-danger)",
    },
    {
      clave: "pendientes",
      etiqueta: "Pendientes",
      valor: aptos.pendientes,
      color: "var(--color-border-strong)",
    },
  ]
}

export function EficaciaAptosDonut({ aptos }: EficaciaAptosDonutProps) {
  const segmentos = construirSegmentos(aptos)
  const total = aptos.total

  return (
    <Card tono="plano" densidad="generosa" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Descomposición</span>
        <h2 className="text-h3 text-text-primary">Aptos presentados</h2>
        <p className="text-body-sm text-text-secondary">
          Qué pasó con los {total} colaboradores que el sistema marcó como aptos.
        </p>
      </header>

      <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_1fr]">
        <div className="relative mx-auto h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segmentos as Segmento[]}
                dataKey="valor"
                nameKey="etiqueta"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="var(--color-surface)"
                strokeWidth={2}
              >
                {segmentos.map((s) => (
                  <Cell key={s.clave} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular font-medium text-display-md text-text-primary leading-none tracking-tight">
              {total}
            </span>
            <span className="mt-1 text-caption text-text-tertiary">aptos</span>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {segmentos.map((s) => {
            const pct = total > 0 ? Math.round((s.valor / total) * 100) : 0
            return (
              <li key={s.clave} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-pill"
                  style={{ background: s.color }}
                  aria-hidden={true}
                />
                <span className="flex-1 text-body-sm text-text-secondary">{s.etiqueta}</span>
                <span className="tabular font-medium font-mono text-body-sm text-text-primary">
                  {s.valor}
                </span>
                <span className="tabular w-10 text-right font-mono text-caption text-text-tertiary">
                  {pct}%
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}
