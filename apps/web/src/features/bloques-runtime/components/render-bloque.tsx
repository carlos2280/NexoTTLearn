import type { BloqueRuntime } from "@nexott-learn/shared-types"
import { BloqueLecturaView } from "./bloque-lectura-view"
import { BloquePlaceholderView } from "./bloque-placeholder-view"

interface RenderBloqueProps {
  readonly bloque: BloqueRuntime
  readonly esActual: boolean
}

// Switch centralizado de Capa 1. Cada nuevo tipo de bloque en sprints
// posteriores agrega su `case`. El default never-check garantiza que TS
// rompa cuando aparezca un tipo nuevo en el contrato sin renderer.

export function RenderBloque({ bloque, esActual }: RenderBloqueProps) {
  switch (bloque.tipo) {
    case "PARRAFO":
      return <BloqueLecturaView bloque={bloque} esActual={esActual} />
    case "CODIGO":
    case "QUIZ":
    case "VIDEO":
    case "RECURSO":
    case "TIP":
      return <BloquePlaceholderView bloque={bloque} esActual={esActual} />
    default: {
      const _exhaustive: never = bloque
      return _exhaustive
    }
  }
}
