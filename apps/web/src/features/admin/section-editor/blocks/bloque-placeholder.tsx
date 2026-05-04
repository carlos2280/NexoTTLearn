import type { TipoContenido } from "@nexott-learn/shared-types"
import { BlockShellPlaceholder } from "../components/block-shell-placeholder"

interface BloquePlaceholderProps {
  readonly tipo: TipoContenido
}

// Cuerpo placeholder para los tipos no implementados en F5.B
// (EJEMPLO_CODIGO, EJERCICIO, TEST). Se delega al placeholder generico
// existente para mantener look y mensaje consistentes.
export function BloquePlaceholder({ tipo }: BloquePlaceholderProps) {
  return <BlockShellPlaceholder tipo={tipo} />
}
