import { KpiCard } from "@/shared/components/ui/kpi-card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type { CoberturaAreaKpis } from "@nexott-learn/shared-types"
import { AlertTriangle, Sparkles, Users } from "lucide-react"

interface KpisGlobalesProps {
  readonly kpis: CoberturaAreaKpis | undefined
  readonly isLoading: boolean
}

export function KpisGlobales({ kpis, isLoading }: KpisGlobalesProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        variant="compact"
        eyebrow="Talento NTT activo"
        value={kpis.totalColaboradoresActivos}
        icon={Users}
        footer={`${kpis.colaboradoresEnExcelencia} en excelencia en alguna área`}
      />
      <KpiCard
        variant="compact"
        eyebrow="Áreas con cobertura sana"
        value={`${kpis.areasSanas}`}
        unit={`/ ${kpis.totalAreas}`}
        icon={Sparkles}
        footer="Promedio ≥ benchmark (70)"
      />
      <KpiCard
        variant="compact"
        eyebrow="Brecha más crítica"
        value={kpis.areaPeorBrecha ? kpis.areaPeorBrecha.nombre : "Sin brechas"}
        icon={AlertTriangle}
        footer={
          kpis.areaPeorBrecha
            ? `${Math.round(kpis.areaPeorBrecha.brecha)} pts vs benchmark`
            : "Todas las áreas sobre benchmark"
        }
      />
    </div>
  )
}
