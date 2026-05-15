import { TrendingDown, TrendingUp } from "lucide-react"
import { PgSection } from "./pg-section"

interface KpiMock {
  readonly eyebrow: string
  readonly valor: string
  readonly unidad?: string
  readonly delta: number
  readonly serie: readonly number[]
}

const KPI_HERO: KpiMock = {
  eyebrow: "Eficacia de plataforma",
  valor: "87",
  unidad: "%",
  delta: 4,
  serie: [62, 68, 71, 70, 76, 80, 84, 87],
}

const KPIS: readonly KpiMock[] = [
  {
    eyebrow: "Candidatos presentados",
    valor: "47",
    delta: 12,
    serie: [22, 28, 30, 35, 38, 42, 44, 47],
  },
  {
    eyebrow: "Aprobados en entrevista",
    valor: "32",
    delta: 9,
    serie: [12, 14, 18, 22, 24, 28, 30, 32],
  },
  {
    eyebrow: "Cursos activos",
    valor: "14",
    delta: -2,
    serie: [18, 17, 16, 16, 15, 14, 14, 14],
  },
  {
    eyebrow: "Colaboradores en curso",
    valor: "126",
    delta: 18,
    serie: [88, 92, 100, 108, 114, 120, 124, 126],
  },
]

export function PgKpis() {
  return (
    <PgSection
      eyebrow="Componentes · Datos"
      titulo="KPI con tendencia"
      descripcion="Sin chips de icono coloreados. Número grande limpio + delta + sparkline. Stripe-style."
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <KpiHero kpi={KPI_HERO} />
        {KPIS.map((k) => (
          <KpiCard key={k.eyebrow} kpi={k} />
        ))}
      </div>
    </PgSection>
  )
}

function KpiHero({ kpi }: { kpi: KpiMock }) {
  return (
    <article
      className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-accent/20 p-6"
      style={{
        background: "var(--gradient-card-acento)",
        boxShadow: "var(--shadow-card-elevated)",
      }}
    >
      <span className="nx-eyebrow text-accent-on-soft">{kpi.eyebrow}</span>
      <div className="flex items-baseline gap-3">
        <span className="tabular font-mono text-display-lg text-text-primary leading-none">
          {kpi.valor}
        </span>
        {kpi.unidad ? (
          <span className="font-semibold text-h2 text-text-secondary">{kpi.unidad}</span>
        ) : null}
        <DeltaBadge delta={kpi.delta} />
      </div>
      <p className="max-w-md text-body-sm text-text-secondary">
        87% de los marcados como aptos pasaron la entrevista del cliente real. La plataforma predice
        correctamente en 41 de 47 casos.
      </p>
      <div className="mt-auto h-16 w-full">
        <Sparkline data={kpi.serie} color="var(--color-accent)" />
      </div>
    </article>
  )
}

function KpiCard({ kpi }: { kpi: KpiMock }) {
  return (
    <article
      className="hover:-translate-y-0.5 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-all duration-base ease-out"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
    >
      <span className="nx-eyebrow text-text-tertiary">{kpi.eyebrow}</span>
      <div className="flex items-baseline gap-2">
        <span className="tabular font-mono text-display-md text-text-primary leading-none">
          {kpi.valor}
        </span>
        <DeltaBadge delta={kpi.delta} />
      </div>
      <div className="mt-auto h-10 w-full">
        <Sparkline data={kpi.serie} color="var(--color-text-tertiary)" />
      </div>
    </article>
  )
}

function DeltaBadge({ delta }: { delta: number }) {
  const up = delta >= 0
  const Icon = up ? TrendingUp : TrendingDown
  const color = up ? "var(--color-chart-delta-up)" : "var(--color-chart-delta-down)"
  return (
    <span
      className="inline-flex items-center gap-1 rounded-pill px-1.5 py-0.5 font-mono font-semibold text-caption"
      style={{ color, background: `rgb(from ${color} r g b / 0.1)` }}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {delta}
    </span>
  )
}

function Sparkline({ data, color }: { data: readonly number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const h = 30
  const step = w / (data.length - 1)
  const puntos = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none">
      <title>Tendencia</title>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={puntos}
      />
    </svg>
  )
}
