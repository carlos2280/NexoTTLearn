import type { LucideIcon } from "lucide-react"

export type GrupoNav = "principal" | "soporte"

export interface NavItem {
  readonly id: string
  readonly etiqueta: string
  readonly ruta: string
  readonly icono: LucideIcon
  readonly grupo: GrupoNav
}
