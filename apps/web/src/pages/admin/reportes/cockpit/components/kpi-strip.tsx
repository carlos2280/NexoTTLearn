import { KpiCard } from "@/shared/components/ui/kpi-card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { EficaciaPlataformaResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, Send, TrendingUp, Users } from "lucide-react"

interface KpiStripProps {
  readonly data: EficaciaPlataformaResponse | undefined
  readonly isLoading: boolean
}

export function KpiStrip({ data, isLoading }: KpiStripProps) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[148px] rounded-2xl" />
        ))}
      </div>
    )
  }

  const totalAptos = data.aptos.total
  const presentados = data.presentadosCliente
  const aceptados = data.aptos.pasaron + data.noAptos.pasaronIgual
  const tasaAceptacion = presentados > 0 ? Math.round((aceptados / presentados) * 100) : 0
  const correlacion = data.correlacion === null ? null : Math.round(data.correlacion * 100)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        variant="compact"
        eyebrow="Aptos generados"
        value={totalAptos}
        icon={Users}
        footer={`${data.aptos.pasaron} pasaron · ${data.aptos.noPasaron} no pasaron`}
      />
      <KpiCard
        variant="compact"
        eyebrow="Presentados al cliente"
        value={presentados}
        icon={Send}
        footer={`${data.aptos.total} aptos + ${data.noAptos.presentadosIgual} no aptos`}
      />
      <KpiCard
        variant="compact"
        eyebrow="Aceptados por cliente"
        value={aceptados}
        icon={CheckCircle2}
        unit={`/ ${presentados}`}
        footer="Decisión final del cliente"
      />
      <KpiCard
        variant="hero"
        eyebrow="Tasa de aceptación"
        value={tasaAceptacion}
        unit="%"
        icon={TrendingUp}
        footer={
          correlacion === null
            ? "Sin datos de correlación apto↔éxito"
            : `Correlación apto↔éxito: ${correlacion}%`
        }
      />
    </div>
  )
}
