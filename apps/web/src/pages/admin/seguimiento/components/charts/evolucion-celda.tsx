import { useCeldaEvolucion } from "@/features/admin-seguimiento/hooks/use-celda-evolucion"
import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Skeleton } from "@/shared/ui/patterns/skeleton"
import type { CeldaEvolucionPunto, CeldaEvolucionResponse } from "@nexott-learn/shared-types"
import { TrendingDown, TrendingUp } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CHART_COLORS, CHART_FONT } from "./chart-tokens"
import { TooltipChart } from "./tooltip-chart"

interface EvolucionCeldaProps {
  readonly cursoId: string
  readonly inscripcionId: string
  readonly areaId: string
  readonly umbralArea: number
}

export function EvolucionCelda({
  cursoId,
  inscripcionId,
  areaId,
  umbralArea,
}: EvolucionCeldaProps) {
  const { data, isLoading, isError } = useCeldaEvolucion({ cursoId, inscripcionId, areaId })

  return (
    <section className="flex flex-col gap-2">
      <h4 className="font-medium text-text-secondary text-xs uppercase tracking-wider">
        Evolución
      </h4>
      {isLoading ? (
        <Skeleton className="h-[200px] w-full rounded-[var(--radius-lg)]" />
      ) : isError || !data ? (
        <EmptyState
          title="No se pudo cargar la evolución"
          description="Reintentá más tarde o revisá la conexión con el servidor."
        />
      ) : data.puntos.length === 0 ? (
        <EmptyState
          title="Sin datos de evolución"
          description="No hay diagnóstico inicial ni entregas registradas en esta área."
        />
      ) : (
        <ContenidoEvolucion data={data} umbralArea={umbralArea} />
      )}
    </section>
  )
}

interface ContenidoEvolucionProps {
  readonly data: CeldaEvolucionResponse
  readonly umbralArea: number
}

interface PuntoChart {
  readonly x: number
  readonly fechaLabel: string
  readonly valor: number | null
  readonly proyectado: number | null
  readonly hito: string | null
}

const MS_POR_DIA = 1000 * 60 * 60 * 24

function ContenidoEvolucion({ data, umbralArea }: ContenidoEvolucionProps) {
  const datos = construirDatos(data)
  const forecast = data.proyeccion

  return (
    <div className="flex flex-col gap-3">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 16, right: 24, bottom: 8, left: -16 }}>
            <CartesianGrid stroke={CHART_COLORS.gridDark} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="fechaLabel"
              tick={{ fill: CHART_COLORS.axisDark, fontSize: CHART_FONT.sizeAxis }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: CHART_COLORS.axisDark, fontSize: CHART_FONT.sizeAxis }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<TooltipChart unidad="" />}
              cursor={{ stroke: "rgba(255,255,255,0.08)" }}
            />
            <ReferenceLine
              y={umbralArea}
              stroke={CHART_COLORS.success}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Objetivo ${umbralArea}`,
                fill: CHART_COLORS.success,
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Line
              type="monotone"
              dataKey="valor"
              name="Histórico"
              stroke={CHART_COLORS.brandViolet}
              strokeWidth={3}
              dot={{
                r: 4,
                fill: CHART_COLORS.brandViolet,
                stroke: "var(--surface-1)",
                strokeWidth: 2,
              }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="proyectado"
              name="Proyección"
              stroke={CHART_COLORS.brandCyan}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls={true}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ForecastCard
        diasAlObjetivo={forecast.diasAlObjetivo}
        valorEstimado={forecast.valorEstimado}
      />
    </div>
  )
}

function construirDatos(data: CeldaEvolucionResponse): PuntoChart[] {
  if (data.puntos.length === 0) {
    return []
  }
  const t0 = new Date(data.puntos[0]?.fecha ?? "").getTime()
  const base: PuntoChart[] = data.puntos.map((p: CeldaEvolucionPunto) => {
    const t = new Date(p.fecha).getTime()
    return {
      x: (t - t0) / MS_POR_DIA,
      fechaLabel: formatearFecha(p.fecha),
      valor: p.valor,
      proyectado: null,
      hito: p.hito,
    }
  })

  const ultimo = base.at(-1)
  if (data.proyeccion.valorEstimado === null || !ultimo) {
    return base
  }
  // Conector: el último punto histórico también semilla la línea de proyección.
  const conectado = base.map((p, i) => (i === base.length - 1 ? { ...p, proyectado: p.valor } : p))
  const xProy = ultimo.x + 30
  const fechaProy = new Date(t0 + xProy * MS_POR_DIA).toISOString()
  conectado.push({
    x: xProy,
    fechaLabel: formatearFecha(fechaProy),
    valor: null,
    proyectado: data.proyeccion.valorEstimado,
    hito: "Proyección 30 días",
  })
  return conectado
}

function formatearFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" })
}

interface ForecastCardProps {
  readonly diasAlObjetivo: number | null
  readonly valorEstimado: number | null
}

function ForecastCard({ diasAlObjetivo, valorEstimado }: ForecastCardProps) {
  if (diasAlObjetivo === null || valorEstimado === null) {
    return (
      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-3 text-text-secondary text-xs">
        <TrendingDown
          className="size-4 shrink-0 text-text-muted"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span>No alcanza el objetivo a este ritmo. Hace falta intervención.</span>
      </div>
    )
  }
  const mensaje =
    diasAlObjetivo === 0
      ? "Ya supera el objetivo."
      : `A este ritmo llega al objetivo en ${diasAlObjetivo} día${diasAlObjetivo === 1 ? "" : "s"}.`
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[rgb(16_185_129/0.3)] bg-[var(--success-bg)] p-3 text-success text-xs">
      <TrendingUp className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span>
        {mensaje} Estimado a 30 días: <strong>{Math.round(valorEstimado)}</strong>.
      </span>
    </div>
  )
}
