import { StatCard } from "@/shared/ui/patterns/stat-card"
import type { KpisCursoResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, FileQuestion, Search, Siren, Target, TrendingUp, Trophy } from "lucide-react"

interface MatrizKpisProps {
  readonly data: KpisCursoResponse | undefined
  readonly isLoading: boolean
}

export function MatrizKpis({ data, isLoading }: MatrizKpisProps) {
  if (!data) {
    return <SkeletonRow loading={isLoading} />
  }
  if (data.tab === "actual") {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="En riesgo"
          value={data.enRiesgo}
          icon={Siren}
          tone={data.enRiesgo > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Cumplimiento"
          value={`${Math.round(data.cumplimientoPct)}%`}
          icon={TrendingUp}
          tone="brand"
        />
        <StatCard
          label="Aptos para entrevista"
          value={data.aptosEntrevista}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Completados" value={data.completados} icon={Trophy} tone="info" />
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Diagnosticados" value={data.diagnosticados} icon={Search} tone="info" />
      <StatCard
        label="Sin diagnóstico"
        value={data.sinDiagnostico}
        icon={FileQuestion}
        tone={data.sinDiagnostico > 0 ? "warning" : "success"}
      />
      <StatCard
        label="Áreas con brecha"
        value={data.areasConBrecha}
        icon={Target}
        tone={data.areasConBrecha > 0 ? "warning" : "success"}
      />
      <StatCard
        label="Cumplimiento inicial"
        value={`${Math.round(data.cumplimientoPromedioInicial)}%`}
        icon={TrendingUp}
        tone="brand"
      />
    </div>
  )
}

function SkeletonRow({ loading }: { readonly loading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <StatCard key={i} label="—" value="—" loading={loading} />
      ))}
    </div>
  )
}
