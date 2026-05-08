import { useCohorteDistribucion } from "@/features/admin-seguimiento/hooks/use-cohorte-distribucion"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import type { EstadoSeguimiento } from "@nexott-learn/shared-types"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChartCard } from "./chart-card"
import { CHART_COLORS } from "./chart-tokens"

interface GraficoDonutEstadosProps {
  readonly cursoId: string
}

const colorEstado = new Map<EstadoSeguimiento, string>([
  ["Apto", CHART_COLORS.success],
  ["EnRuta", CHART_COLORS.warning],
  ["EnRiesgo", CHART_COLORS.danger],
  ["Completado", CHART_COLORS.brandViolet],
])

const labelEstado = new Map<EstadoSeguimiento, string>([
  ["Apto", "Aptos"],
  ["EnRuta", "En ruta"],
  ["EnRiesgo", "En riesgo"],
  ["Completado", "Completados"],
])

export function GraficoDonutEstados({ cursoId }: GraficoDonutEstadosProps) {
  const { data, isLoading, isError } = useCohorteDistribucion(cursoId)

  if (isLoading) {
    return (
      <ChartCard
        title="Distribución de la cohorte"
        subtitle="Estados actuales · click en leyenda para filtrar"
      >
        <Skeleton className="h-[180px] w-full" />
      </ChartCard>
    )
  }

  if (isError || !data) {
    return (
      <ChartCard
        title="Distribución de la cohorte"
        subtitle="Estados actuales · click en leyenda para filtrar"
      >
        <EmptyState
          title="No se pudo cargar la distribución"
          description="Reintentá más tarde o revisá la conexión con el servidor."
        />
      </ChartCard>
    )
  }

  const datos = data.distribucion.map((d) => ({
    name: labelEstado.get(d.estado) ?? d.estado,
    value: d.cantidad,
    key: d.estado,
  }))
  const total = datos.reduce((s, d) => s + d.value, 0)

  return (
    <ChartCard
      title="Distribución de la cohorte"
      subtitle="Estados actuales · click en leyenda para filtrar"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative aspect-square w-[160px] max-w-full sm:w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Pie
                data={datos}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={3}
                strokeWidth={0}
              >
                {datos.map((d) => (
                  <Cell key={d.key} fill={colorEstado.get(d.key) ?? CHART_COLORS.brandViolet} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-2)",
                  border: "1px solid var(--glass-border-strong)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--text-secondary)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold text-2xl text-[var(--text-primary)] tracking-tight">
              {total}
            </span>
            <span className="text-[var(--text-muted)] text-xs">candidatos</span>
          </div>
        </div>
        <ul className="grid w-full grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {datos.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
            return (
              <li key={d.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: colorEstado.get(d.key) ?? CHART_COLORS.brandViolet }}
                    aria-hidden={true}
                  />
                  <span className="text-[var(--text-secondary)]">{d.name}</span>
                </span>
                <span className="flex items-baseline gap-1.5 tabular-nums">
                  <span className="font-semibold text-[var(--text-primary)]">{d.value}</span>
                  <span className="text-[var(--text-muted)] text-xs">{pct}%</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </ChartCard>
  )
}
