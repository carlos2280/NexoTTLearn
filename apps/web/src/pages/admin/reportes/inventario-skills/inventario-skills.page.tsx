import { useInventarioSkills } from "@/features/reportes/hooks/use-inventario-skills"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import { InventarioHeader } from "./components/inventario-header"
import { InventarioKpis } from "./components/inventario-kpis"
import { InventarioTabla } from "./components/inventario-tabla"

const UMBRAL_DEFAULT = 70

export function InventarioSkillsPage() {
  const { data, isLoading, error } = useInventarioSkills()

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <InventarioHeader umbralCumple={UMBRAL_DEFAULT} />
        <InventarioSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <InventarioHeader umbralCumple={UMBRAL_DEFAULT} />
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
      <InventarioHeader
        frescura={data.meta.frescura}
        scopeHash={data.meta.scopeHash}
        umbralCumple={UMBRAL_DEFAULT}
      />

      {data.meta.warning && (
        <Banner tone="warning" title="Resultado parcial">
          {data.meta.warning}
        </Banner>
      )}

      <InventarioKpis skills={data.skills} />
      <InventarioTabla skills={data.skills} />
    </div>
  )
}

function InventarioSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={`skel-${i + 1}`} tono="plano" className="h-[110px] animate-pulse" />
        ))}
      </div>
    </div>
  )
}
