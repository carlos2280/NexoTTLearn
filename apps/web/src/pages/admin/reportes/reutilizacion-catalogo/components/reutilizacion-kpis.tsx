import { KpiCard } from "@/shared/components/ui/kpi-card"
import type {
  ReutilizacionCatalogoModuloItem,
  ReutilizacionCatalogoSkillItem,
} from "@nexott-learn/shared-types"
import { Boxes, Layers, Recycle } from "lucide-react"

interface ReutilizacionKpisProps {
  readonly modulos: readonly ReutilizacionCatalogoModuloItem[]
  readonly skills: readonly ReutilizacionCatalogoSkillItem[]
}

function moduloTop(
  modulos: readonly ReutilizacionCatalogoModuloItem[],
): ReutilizacionCatalogoModuloItem | null {
  const primero = modulos[0]
  if (!primero) {
    return null
  }
  return modulos.reduce((max, m) => (m.vecesUsado > max.vecesUsado ? m : max), primero)
}

export function ReutilizacionKpis({ modulos, skills }: ReutilizacionKpisProps) {
  const totalCursosModulos = modulos.reduce((s, m) => s + m.vecesUsado, 0)
  const promedioReuso = modulos.length > 0 ? (totalCursosModulos / modulos.length).toFixed(1) : "—"
  const top = moduloTop(modulos)

  return (
    <section
      aria-label="Métricas cumbre"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr_1fr]"
    >
      <KpiCard
        variant="hero"
        eyebrow="Módulo más reutilizado"
        value={top ? top.titulo : "—"}
        footer={top ? `Usado en ${top.cursosUnicos} cursos · ${top.vecesUsado} veces` : "Sin datos"}
        icon={Recycle}
      />

      <KpiCard
        variant="compact"
        eyebrow="Módulos en uso"
        value={modulos.length}
        footer={`Reuso promedio ${promedioReuso} cursos`}
        icon={Boxes}
      />

      <KpiCard
        variant="compact"
        eyebrow="Skills en catálogo"
        value={skills.length}
        footer={`${skills.reduce((s, sk) => s + sk.vecesExigida, 0)} apariciones totales en cursos`}
        icon={Layers}
      />
    </section>
  )
}
