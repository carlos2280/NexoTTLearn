import { useCohorteSerie } from "@/features/admin-seguimiento/hooks/use-cohorte-serie"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import { TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartCard } from "./chart-card"
import { CHART_COLORS, CHART_FONT, GRADIENT_IDS } from "./chart-tokens"
import { TooltipChart } from "./tooltip-chart"

const OBJETIVO_DEFAULT = 80

interface GraficoLineaCohorteProps {
  readonly cursoId: string
  readonly objetivo?: number
}

export function GraficoLineaCohorte({
  cursoId,
  objetivo = OBJETIVO_DEFAULT,
}: GraficoLineaCohorteProps) {
  const { data, isLoading, isError } = useCohorteSerie(cursoId)

  if (isLoading) {
    return (
      <ChartCard
        title="Cumplimiento global de la cohorte"
        subtitle="Promedio ponderado · evolución desde el inicio"
      >
        <Skeleton className="h-[220px] w-full" />
      </ChartCard>
    )
  }

  if (isError || !data) {
    return (
      <ChartCard
        title="Cumplimiento global de la cohorte"
        subtitle="Promedio ponderado · evolución desde el inicio"
      >
        <EmptyState
          title="No se pudo cargar la serie"
          description="Reintentá más tarde o revisá la conexión con el servidor."
        />
      </ChartCard>
    )
  }

  const puntos = data.puntos.map((p) => ({ name: p.etiqueta, valor: p.valor }))
  const ultimo = puntos.at(-1)?.valor ?? 0
  const primero = puntos.at(0)?.valor ?? 0
  const delta = Math.round(ultimo - primero)

  return (
    <ChartCard
      title="Cumplimiento global de la cohorte"
      subtitle="Promedio ponderado · evolución desde el inicio"
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-bg)] px-3 py-1 font-semibold text-[var(--success)] text-xs">
          <TrendingUp className="size-3.5" strokeWidth={2.5} />
          {delta >= 0 ? "+" : ""}
          {delta} pts
        </span>
      }
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={puntos} margin={{ top: 16, right: 24, bottom: 8, left: -16 }}>
            <defs>
              <linearGradient id={GRADIENT_IDS.brand} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={CHART_COLORS.brandViolet} />
                <stop offset="100%" stopColor={CHART_COLORS.brandCyan} />
              </linearGradient>
              <linearGradient id={GRADIENT_IDS.brandSoft} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.brandViolet} stopOpacity={0.35} />
                <stop offset="100%" stopColor={CHART_COLORS.brandViolet} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.gridDark} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: CHART_COLORS.axisDark, fontSize: CHART_FONT.sizeAxis }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: CHART_COLORS.axisDark, fontSize: CHART_FONT.sizeAxis }}
              tickLine={false}
              axisLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={<TooltipChart unidad="%" />}
              cursor={{ stroke: "rgba(255,255,255,0.08)" }}
            />
            <ReferenceLine
              y={objetivo}
              stroke={CHART_COLORS.success}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Objetivo ${objetivo}`,
                fill: CHART_COLORS.success,
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke={`url(#${GRADIENT_IDS.brand})`}
              strokeWidth={3}
              fill={`url(#${GRADIENT_IDS.brandSoft})`}
              dot={{
                r: 4,
                fill: CHART_COLORS.brandViolet,
                stroke: "var(--surface-1)",
                strokeWidth: 2,
              }}
              activeDot={{ r: 6, fill: CHART_COLORS.brandViolet, stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
