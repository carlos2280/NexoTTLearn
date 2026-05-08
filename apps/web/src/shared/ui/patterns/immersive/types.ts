// Tipos compartidos del shell inmersivo. La idea: las primitivas (Tree,
// Canvas, Inspector, Shell) son agnosticas del rol. Tanto el editor del
// admin como el modo estudio del participante consumen las mismas, pasando
// `mode: "edit" | "read"` y data shape compatible.

import type { ReactNode } from "react"

export type ImmersiveMode = "edit" | "read"

export interface TreeNode {
  readonly id: string
  readonly label: string
  readonly icon?: ReactNode
  readonly meta?: ReactNode
  readonly children?: readonly TreeNode[]
  /**
   * Acento visual del nodo. Se usa, por ejemplo, para colorear áreas con su
   * color de catalogo. Si null, usa el tono neutro del tema.
   */
  readonly accent?: string | null
  /**
   * Indicador discreto al final del nombre (estado, %, etc.).
   */
  readonly badge?: ReactNode
  /**
   * Acción contextual al final de la fila (`+ Sección`, `[⋯]`...). Se
   * renderiza solo en modo edit.
   */
  readonly action?: ReactNode
  /** Si true, renderiza un divisor horizontal antes de este nodo. */
  readonly divider?: boolean
  /**
   * Slot opcional renderizado después de los hijos cuando el nodo está
   * expandido. Útil para barras de validación/guardado contextual al grupo.
   */
  readonly footer?: ReactNode
}
