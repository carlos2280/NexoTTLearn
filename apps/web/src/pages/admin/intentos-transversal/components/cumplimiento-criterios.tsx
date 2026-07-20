import type { CumplimientoCriterio } from "@nexott-learn/shared-types"
import { Check, Circle, type LucideIcon, Minus, X } from "lucide-react"

interface CumplimientoCriteriosProps {
  readonly criterios: readonly CumplimientoCriterio[]
}

interface EstadoVisual {
  readonly icono: LucideIcon
  /** Color pleno del ícono (gráfico, umbral de contraste 3:1). */
  readonly colorIcono: string
  /** Color del label de texto (chico): tono `-on-soft` para pasar AA 4.5:1. */
  readonly colorTexto: string
  readonly etiqueta: string
}

/**
 * Presentación de cada estado de `cumple`. Colores semánticos (capa feedback,
 * no marca): verde cumple, ámbar parcial, rojo no, neutro no verificable. El
 * ícono usa el tono pleno; el label chico, el `-on-soft` (más oscuro) que sí
 * pasa contraste a 12px.
 */
function estadoVisual(cumple: CumplimientoCriterio["cumple"]): EstadoVisual {
  if (cumple === "cumple") {
    return {
      icono: Check,
      colorIcono: "text-success",
      colorTexto: "text-success-on-soft",
      etiqueta: "Cumple",
    }
  }
  if (cumple === "parcial") {
    return {
      icono: Minus,
      colorIcono: "text-warning",
      colorTexto: "text-warning-on-soft",
      etiqueta: "Parcial",
    }
  }
  if (cumple === "no") {
    return {
      icono: X,
      colorIcono: "text-danger",
      colorTexto: "text-danger-on-soft",
      etiqueta: "No cumple",
    }
  }
  return {
    icono: Circle,
    colorIcono: "text-text-tertiary",
    colorTexto: "text-text-secondary",
    etiqueta: "Sin verificar",
  }
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
          const { icono: Icono, colorIcono, colorTexto, etiqueta } = estadoVisual(item.cumple)
          return (
            <li key={`${i}-${item.criterio}`} className="flex items-start gap-2.5">
              <Icono
                className={`mt-0.5 h-4 w-4 shrink-0 ${colorIcono}`}
                strokeWidth={2}
                aria-hidden={true}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-body-sm text-text-primary">
                  {item.criterio}
                  <span className={`ml-2 text-caption ${colorTexto}`}>{etiqueta}</span>
                </span>
                {item.evidencia ? (
                  <span className="text-caption text-text-secondary">{item.evidencia}</span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
