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
  /**
   * Items del menú contextual (click derecho + boton ⋯). El árbol los
   * renderiza tanto en context menu como en dropdown del boton. Pasa los
   * `<ContextMenuItem>` o `<DropdownMenuItem>` directamente — el árbol los
   * envuelve. Si null/undefined, el row no expone menu.
   */
  readonly menu?: TreeMenu
  /** Si true, atenúa visualmente el row (nodo archivado). */
  readonly muted?: boolean
}

/**
 * Render-prop pair para que el consumidor describa el menú de un row sin
 * acoplar la primitiva a Radix-context vs Radix-dropdown. El árbol invoca
 * uno u otro según el disparador (click derecho vs botón ⋯).
 */
export interface TreeMenu {
  readonly contextItems: ReactNode
  readonly dropdownItems: ReactNode
}
