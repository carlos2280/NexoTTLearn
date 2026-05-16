import { useEficaciaPlataforma } from "@/features/reportes/hooks/use-eficacia-plataforma"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import { EficaciaAptosDonut } from "./components/eficacia-aptos-donut"
import { EficaciaFalsosNegativos } from "./components/eficacia-falsos-negativos"
import { EficaciaHeader } from "./components/eficacia-header"
import { EficaciaKpis } from "./components/eficacia-kpis"
import { EficaciaObservaciones } from "./components/eficacia-observaciones"

export function EficaciaPlataformaPage() {
  const { data, isLoading, error } = useEficaciaPlataforma()

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <EficaciaHeader />
        <EficaciaSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <EficaciaHeader />
        <Banner tone="danger" title="No pudimos cargar el reporte">
          {error.message}
        </Banner>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
      <EficaciaHeader frescura={data.meta.frescura} scopeHash={data.meta.scopeHash} />

      {data.meta.warning && (
        <Banner tone="warning" title="Resultado parcial">
          {data.meta.warning}
        </Banner>
      )}

      <EficaciaKpis data={data} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EficaciaAptosDonut aptos={data.aptos} />
        <EficaciaFalsosNegativos noAptos={data.noAptos} />
      </div>

      <EficaciaObservaciones observaciones={data.observacionesFrecuentes} />
    </div>
  )
}

function EficaciaSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card tono="plano" className="h-[280px] animate-pulse" />
        <Card tono="plano" className="h-[280px] animate-pulse" />
      </div>
      <Card tono="plano" className="h-[240px] animate-pulse" />
    </div>
  )
}
