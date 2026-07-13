import type { CumplimientoCriterio } from "@nexott-learn/shared-types"
import { Check, Circle, type LucideIcon, Minus, X } from "lucide-react"

interface CumplimientoCriteriosProps {
  readonly criterios: readonly CumplimientoCriterio[]
}

interface EstadoVisual {
  readonly icono: LucideIcon
  readonly color: string
  readonly etiqueta: string
}

/**
 * Presentación de cada estado de `cumple`. Colores semánticos (capa feedback,
 * no marca): verde cumple, ámbar parcial, rojo no, neutro no verificable.
 */
function estadoVisual(cumple: CumplimientoCriterio["cumple"]): EstadoVisual {
  if (cumple === "cumple") {
    return { icono: Check, color: "text-success", etiqueta: "Cumple" }
  }
  if (cumple === "parcial") {
    return { icono: Minus, color: "text-warning", etiqueta: "Parcial" }
  }
  if (cumple === "no") {
    return { icono: X, color: "text-danger", etiqueta: "No cumple" }
  }
  return { icono: Circle, color: "text-text-tertiary", etiqueta: "Sin verificar" }
}

/**
 * Checklist del informe admin: cómo cumplió el repo cada ítem de la "Lista a
 * evaluar" que redactó el admin. Solo lectura. Si no hay lista, no renderiza.
 */
export function CumplimientoCriterios({ criterios }: CumplimientoCriteriosProps) {
  if (criterios.length === 0) {
    return null
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="nx-eyebrow text-text-tertiary">Cumplimiento de la lista</span>
      <ul className="flex flex-col gap-2.5">
        {criterios.map((item, i) => {
          const { icono: Icono, color, etiqueta } = estadoVisual(item.cumple)
          return (
            <li key={`${i}-${item.criterio}`} className="flex items-start gap-2.5">
              <Icono
                className={`mt-0.5 h-4 w-4 shrink-0 ${color}`}
                strokeWidth={2}
                aria-hidden={true}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-body-sm text-text-primary">
                  {item.criterio}
                  <span className={`ml-2 text-caption ${color}`}>{etiqueta}</span>
                </span>
                {item.evidencia ? (
                  <span className="text-caption text-text-tertiary">{item.evidencia}</span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
