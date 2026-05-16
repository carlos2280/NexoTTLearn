import { KpiCard } from "@/shared/components/ui/kpi-card"
import type { EficaciaPlataformaResponse } from "@nexott-learn/shared-types"
import { Target, TrendingUp, Users } from "lucide-react"

interface EficaciaKpisProps {
  readonly data: EficaciaPlataformaResponse
}

function porcentajeAcierto(aptos: EficaciaPlataformaResponse["aptos"]): number | null {
  const resueltos = aptos.pasaron + aptos.noPasaron
  if (resueltos === 0) {
    return null
  }
  return Math.round((aptos.pasaron / resueltos) * 100)
}

function interpretarCorrelacion(valor: number): string {
  const abs = Math.abs(valor)
  if (abs >= 0.7) {
    return "Predicción fuerte"
  }
  if (abs >= 0.4) {
    return "Predicción moderada"
  }
  if (abs >= 0.2) {
    return "Predicción débil"
  }
  return "Sin señal clara"
}

export function EficaciaKpis({ data }: EficaciaKpisProps) {
  const acierto = porcentajeAcierto(data.aptos)
  const correlacion = data.correlacion

  return (
    <section
      aria-label="Métricas cumbre"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]"
    >
      <KpiCard
        variant="hero"
        eyebrow="Presentados al cliente"
        value={data.presentadosCliente}
        footer={`${data.aptos.total} aptos · ${data.noAptos.presentadosIgual} no-aptos presentados igual`}
        icon={Users}
      />

      <KpiCard
        variant="compact"
        eyebrow="Acierto del sistema"
        value={acierto === null ? "—" : acierto}
        unit={acierto === null ? undefined : "%"}
        tono={
          acierto === null
            ? "acento"
            : acierto >= 75
              ? "success"
              : acierto >= 50
                ? "acento"
                : "danger"
        }
        footer={
          acierto === null
            ? "Sin resultados resueltos todavía"
            : `${data.aptos.pasaron} pasaron de ${data.aptos.pasaron + data.aptos.noPasaron} resueltos`
        }
        icon={TrendingUp}
      />

      <KpiCard
        variant="compact"
        eyebrow="Correlación apto↔éxito"
        value={correlacion === null ? "—" : correlacion.toFixed(2)}
        tono={
          correlacion === null ? "acento" : Math.abs(correlacion) >= 0.4 ? "success" : "warning"
        }
        footer={correlacion === null ? "Datos insuficientes" : interpretarCorrelacion(correlacion)}
        icon={Target}
      />
    </section>
  )
}
