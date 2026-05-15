import { Card } from "@/shared/components/ui/card"
import type { EficaciaPlataformaNoAptos } from "@nexott-learn/shared-types"

interface EficaciaFalsosNegativosProps {
  readonly noAptos: EficaciaPlataformaNoAptos
}

export function EficaciaFalsosNegativos({ noAptos }: EficaciaFalsosNegativosProps) {
  const { total, presentadosIgual, pasaronIgual } = noAptos
  const porcentajeFalsosNegativos =
    presentadosIgual > 0 ? Math.round((pasaronIgual / presentadosIgual) * 100) : null

  return (
    <Card tono="plano" densidad="generosa" className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Contraste</span>
        <h2 className="text-h3 text-text-primary">No-aptos presentados igual</h2>
        <p className="text-body-sm text-text-secondary">
          Mide los falsos negativos del sistema: cuántos no-aptos terminaron pasando.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Metrica etiqueta="No-aptos detectados" valor={total} tono="neutro" />
        <Metrica etiqueta="Presentados igual" valor={presentadosIgual} tono="warning" />
        <Metrica etiqueta="Pasaron" valor={pasaronIgual} tono="success" />
      </div>

      {porcentajeFalsosNegativos !== null && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-subtle px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-body-sm text-text-secondary">Tasa de falsos negativos</span>
            <span className="tabular font-medium font-mono text-h3 text-text-primary">
              {porcentajeFalsosNegativos}%
            </span>
          </div>
          <p className="text-caption text-text-tertiary">
            {porcentajeFalsosNegativos >= 30
              ? "Señal de que el umbral de apto puede estar siendo demasiado exigente."
              : "El sistema rechaza con criterio: pocos no-aptos terminan pasando."}
          </p>
        </div>
      )}
    </Card>
  )
}

interface MetricaProps {
  readonly etiqueta: string
  readonly valor: number
  readonly tono: "neutro" | "warning" | "success"
}

function Metrica({ etiqueta, valor, tono }: MetricaProps) {
  const colorValor =
    tono === "success"
      ? "text-success-on-soft"
      : tono === "warning"
        ? "text-warning-on-soft"
        : "text-text-primary"

  return (
    <div className="flex flex-col gap-1">
      <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
      <span
        className={`tabular font-medium font-mono text-display-md leading-none tracking-tight ${colorValor}`}
      >
        {valor}
      </span>
    </div>
  )
}
