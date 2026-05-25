import { useReutilizacionCatalogo } from "@/features/reportes/hooks/use-reutilizacion-catalogo"
import { Banner } from "@/shared/components/ui/banner"
import { Card } from "@/shared/components/ui/card"
import type {
  ReutilizacionCatalogoModuloItem,
  ReutilizacionCatalogoSkillItem,
} from "@nexott-learn/shared-types"
import { Boxes, Layers } from "lucide-react"
import { ReutilizacionHeader } from "./components/reutilizacion-header"
import { ReutilizacionKpis } from "./components/reutilizacion-kpis"
import { type RankingItem, ReutilizacionRanking } from "./components/reutilizacion-ranking"

function modulosARanking(modulos: readonly ReutilizacionCatalogoModuloItem[]): RankingItem[] {
  return modulos.map((m) => ({
    id: m.moduloId,
    nombre: m.titulo,
    vecesUsado: m.vecesUsado,
    cursosUnicos: m.cursosUnicos,
  }))
}

function skillsARanking(skills: readonly ReutilizacionCatalogoSkillItem[]): RankingItem[] {
  return skills.map((s) => ({
    id: s.skillId,
    nombre: s.etiqueta,
    vecesUsado: s.vecesExigida,
    cursosUnicos: s.cursosUnicos,
  }))
}

export function ReutilizacionCatalogoPage() {
  const { data, isLoading, error } = useReutilizacionCatalogo()

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <ReutilizacionHeader />
        <Skeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10">
        <ReutilizacionHeader />
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
      <ReutilizacionHeader frescura={data.meta.frescura} scopeHash={data.meta.scopeHash} />

      {data.meta.warning && (
        <Banner tone="warning" title="Resultado parcial">
          {data.meta.warning}
        </Banner>
      )}

      <ReutilizacionKpis modulos={data.modulos} skills={data.skills} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReutilizacionRanking
          eyebrow="Catálogo · Didáctica"
          titulo="Módulos más reutilizados"
          descripcion="Componentes del catálogo que aparecen en múltiples cursos."
          etiquetaMetricaPrincipal="veces usado"
          icono={Boxes}
          items={modulosARanking(data.modulos)}
          vacioMensaje="No hay módulos reutilizados todavía."
        />
        <ReutilizacionRanking
          eyebrow="Catálogo · Talento"
          titulo="Skills más exigidas"
          descripcion="Skills que aparecen como requisito en múltiples cursos del cliente."
          etiquetaMetricaPrincipal="veces exigida"
          icono={Layers}
          items={skillsARanking(data.skills)}
          vacioMensaje="No hay skills exigidas todavía."
        />
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
        <Card tono="plano" className="h-[200px] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card tono="plano" className="h-[420px] animate-pulse" />
        <Card tono="plano" className="h-[420px] animate-pulse" />
      </div>
    </div>
  )
}
