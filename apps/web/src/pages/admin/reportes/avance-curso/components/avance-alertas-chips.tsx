import type { TipoAlerta } from "@nexott-learn/shared-types"
import { obtenerAlerta } from "../avance-curso.types"

interface AvanceAlertasChipsProps {
  readonly alertas: readonly TipoAlerta[]
}

export function AvanceAlertasChips({ alertas }: AvanceAlertasChipsProps) {
  if (alertas.length === 0) {
    return <span className="text-caption text-text-tertiary">—</span>
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {alertas.map((id) => {
        const def = obtenerAlerta(id)
        if (!def) {
          return null
        }
        const Icono = def.icono
        const colorVar = def.tono === "danger" ? "--color-danger-rgb" : "--color-warning-rgb"
        const onSoft =
          def.tono === "danger" ? "var(--color-danger-on-soft)" : "var(--color-warning-on-soft)"
        return (
          <li
            key={id}
            className="inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-caption"
            style={{
              background: `rgb(var(${colorVar}) / 0.12)`,
              color: onSoft,
            }}
            title={def.etiqueta}
          >
            <Icono className="h-3 w-3 shrink-0" aria-hidden={true} />
            {def.etiqueta}
          </li>
        )
      })}
    </ul>
  )
}
