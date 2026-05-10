import { useCohorteAreas } from "@/features/admin-seguimiento/hooks/use-cohorte-areas"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartCard } from "./chart-card"
import { CHART_COLORS, CHART_FONT } from "./chart-tokens"
import { TooltipChart } from "./tooltip-chart"

interface GraficoBarrasAreasProps {
  readonly cursoId: string
}

function colorBarra(promedio: number, objetivo: number): string {
  if (promedio >= objetivo) {
    return CHART_COLORS.success
  }
  if (promedio >= objetivo - 10) {
    return CHART_COLORS.warning
  }
  return CHART_COLORS.danger
}

export function GraficoBarrasAreas({ cursoId }: GraficoBarrasAreasProps) {
  const { data, isLoading, isError } = useCohorteAreas(cursoId)

  if (isLoading) {
    return (
      <ChartCard title="Promedio por área" subtitle="Detecta dónde concentra la cohorte la brecha">
        <Skeleton className="h-[220px] w-full" />
      </ChartCard>
    )
  }

  if (isError || !data) {
    return (
      <ChartCard title="Promedio por área" subtitle="Detecta dónde concentra la cohorte la brecha">
        <EmptyState
          title="No se pudo cargar el promedio por área"
          description="Reintentá más tarde o revisá la conexión con el servidor."
        />
      </ChartCard>
    )
  }

  const datos = data.areas.map((a) => ({
    name: a.nombre,
    valor: a.promedio,
    objetivo: a.objetivo,
  }))

  const objetivoComun =
    datos.length > 0 ? Math.round(datos.reduce((s, a) => s + a.objetivo, 0) / datos.length) : 70

  return (
    <ChartCard title="Promedio por área" subtitle="Detecta dónde concentra la cohorte la brecha">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datos}
            layout="vertical"
            margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
          >
            <XAxis type="number" hide={true} domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: CHART_COLORS.axisDark, fontSize: CHART_FONT.sizeAxis }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              content={<TooltipChart unidad="/ 100" mostrarObjetivo={true} />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <ReferenceLine
              x={objetivoComun}
              stroke={CHART_COLORS.success}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
            />
            <Bar
              dataKey="valor"
              radius={[0, 8, 8, 0]}
              barSize={18}
              label={{
                position: "right",
                fill: "var(--text-secondary)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {datos.map((d) => (
                <Cell key={d.name} fill={colorBarra(d.valor, d.objetivo)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
