import { RUTAS } from "@/shared/constants/rutas"
import {
  BarChart3,
  BookOpen,
  Building2,
  Home,
  Library,
  type LucideIcon,
  Settings,
  Users,
} from "lucide-react"

export type GrupoComando = "navegar" | "acciones"

export interface Comando {
  readonly id: string
  readonly etiqueta: string
  readonly hint?: string
  readonly icono: LucideIcon
  readonly grupo: GrupoComando
  readonly ruta?: string
  readonly atajo?: readonly string[]
}

export const COMANDOS: readonly Comando[] = [
  {
    id: "nav-inicio",
    etiqueta: "Ir a Inicio",
    icono: Home,
    grupo: "navegar",
    ruta: RUTAS.admin.inicio,
    atajo: ["g", "i"],
  },
  {
    id: "nav-cursos",
    etiqueta: "Ir a Cursos",
    icono: BookOpen,
    grupo: "navegar",
    ruta: RUTAS.admin.cursos,
    atajo: ["g", "c"],
  },
  {
    id: "nav-personas",
    etiqueta: "Ir a Personas",
    icono: Users,
    grupo: "navegar",
    ruta: RUTAS.admin.personas,
    atajo: ["g", "p"],
  },
  {
    id: "nav-clientes",
    etiqueta: "Ir a Clientes",
    icono: Building2,
    grupo: "navegar",
    ruta: RUTAS.admin.clientes,
    atajo: ["g", "l"],
  },
  {
    id: "nav-catalogo",
    etiqueta: "Ir al Catálogo",
    icono: Library,
    grupo: "navegar",
    ruta: RUTAS.admin.catalogo,
    atajo: ["g", "k"],
  },
  {
    id: "nav-reportes",
    etiqueta: "Ir a Reportes",
    icono: BarChart3,
    grupo: "navegar",
    ruta: RUTAS.admin.reportes,
    atajo: ["g", "r"],
  },
  {
    id: "nav-sistema",
    etiqueta: "Ir a Sistema",
    icono: Settings,
    grupo: "navegar",
    ruta: RUTAS.admin.sistema,
    atajo: ["g", "s"],
  },
]

export const ETIQUETA_GRUPO: Record<GrupoComando, string> = {
  navegar: "Navegar",
  acciones: "Acciones",
}
