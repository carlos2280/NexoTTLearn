import { Card } from "@/shared/components/ui/card"
import type { ItemPlanReporte } from "@nexott-learn/shared-types"
import { etiquetaRazon, obtenerCaracter } from "../detalle-colaborador.types"

interface DetallePlanProps {
  readonly plan: readonly ItemPlanReporte[]
}

export function DetallePlan({ plan }: DetallePlanProps) {
  return (
    <Card tono="plano" densidad="generosa" className="flex h-full flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Plan personal</span>
        <h2 className="text-h3 text-text-primary">Secciones asignadas</h2>
        <p className="text-body-sm text-text-secondary">
          Lo que el sistema priorizó para este colaborador según su ficha y las skills exigidas.
        </p>
      </header>

      {plan.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Sin items en el plan personal todavía.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {plan.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </Card>
  )
}

interface ItemRowProps {
  readonly item: ItemPlanReporte
}

function ItemRow({ item }: ItemRowProps) {
  const caracter = obtenerCaracter(item.caracter)

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      {caracter ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 font-medium text-caption"
          style={{ background: caracter.tokenSoft, color: caracter.tokenOnSoft }}
        >
          <span
            aria-hidden={true}
            className="h-1.5 w-1.5 rounded-pill"
            style={{ background: caracter.tokenColor }}
          />
          {caracter.etiqueta}
        </span>
      ) : (
        <span className="text-caption text-text-tertiary">{item.caracter}</span>
      )}

      <span className="flex-1 text-body-sm text-text-secondary">{etiquetaRazon(item.razon)}</span>
    </li>
  )
}
