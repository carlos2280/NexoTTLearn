import type { InventarioSkillItem } from "@nexott-learn/shared-types"
import { NIVELES, type NivelCualitativo } from "../inventario-skills.types"

interface InventarioSkillRowProps {
  readonly skill: InventarioSkillItem
}

function calcularTotalRegistros(porNivel: InventarioSkillItem["porEtiquetaCualitativa"]): number {
  return porNivel.excelencia + porNivel.solido + porNivel.enDesarrollo + porNivel.noCumple
}

export function InventarioSkillRow({ skill }: InventarioSkillRowProps) {
  const { etiqueta, totalColaboradores, porEtiquetaCualitativa } = skill
  const totalRegistros = calcularTotalRegistros(porEtiquetaCualitativa)

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-base ease-default hover:border-border-strong hover:shadow-[var(--shadow-card-elevated)]">
      <header className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-body text-text-primary">{etiqueta}</span>
        <span className="inline-flex items-baseline gap-1.5">
          <span className="tabular font-medium font-mono text-h3 text-text-primary">
            {totalColaboradores}
          </span>
          <span className="text-caption text-text-tertiary">colaboradores</span>
        </span>
      </header>

      <BarraApilada porNivel={porEtiquetaCualitativa} total={totalRegistros} />

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {NIVELES.map((n) => (
          <ChipNivel
            key={n.id}
            id={n.id}
            etiqueta={n.etiqueta}
            color={n.tokenColor}
            valor={porEtiquetaCualitativa[n.id]}
          />
        ))}
      </footer>
    </li>
  )
}

interface BarraApiladaProps {
  readonly porNivel: InventarioSkillItem["porEtiquetaCualitativa"]
  readonly total: number
}

function BarraApilada({ porNivel, total }: BarraApiladaProps) {
  if (total === 0) {
    return <div className="h-2 w-full rounded-pill bg-subtle" aria-label="Sin registros" />
  }
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-pill bg-subtle"
      role="img"
      aria-label="Distribución de niveles"
    >
      {NIVELES.map((n) => {
        const valor = porNivel[n.id]
        if (valor === 0) {
          return null
        }
        const pct = (valor / total) * 100
        return (
          <span
            key={n.id}
            className="h-full"
            style={{ width: `${pct}%`, background: n.tokenColor }}
          />
        )
      })}
    </div>
  )
}

interface ChipNivelProps {
  readonly id: NivelCualitativo
  readonly etiqueta: string
  readonly color: string
  readonly valor: number
}

function ChipNivel({ etiqueta, color, valor }: ChipNivelProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden={true} className="h-1.5 w-1.5 rounded-pill" style={{ background: color }} />
      <span className="text-caption text-text-tertiary">{etiqueta}</span>
      <span className="tabular font-medium font-mono text-caption text-text-secondary">
        {valor}
      </span>
    </span>
  )
}
