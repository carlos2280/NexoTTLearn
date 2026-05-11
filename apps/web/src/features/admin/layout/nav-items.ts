import { RUTAS } from "@/shared/constants/rutas"
import { BarChart3, BookOpen, Building2, Home, Library, Settings, Users } from "lucide-react"
import type { NavItem } from "./types"

export const NAV_ITEMS: readonly NavItem[] = [
  { id: "inicio", etiqueta: "Inicio", ruta: RUTAS.admin.inicio, icono: Home, grupo: "principal" },
  {
    id: "cursos",
    etiqueta: "Cursos",
    ruta: RUTAS.admin.cursos,
    icono: BookOpen,
    grupo: "principal",
  },
  {
    id: "personas",
    etiqueta: "Personas",
    ruta: RUTAS.admin.personas,
    icono: Users,
    grupo: "principal",
  },
  {
    id: "clientes",
    etiqueta: "Clientes",
    ruta: RUTAS.admin.clientes,
    icono: Building2,
    grupo: "principal",
  },
  {
    id: "catalogo",
    etiqueta: "Catálogo",
    ruta: RUTAS.admin.catalogo,
    icono: Library,
    grupo: "principal",
  },
  {
    id: "reportes",
    etiqueta: "Reportes",
    ruta: RUTAS.admin.reportes,
    icono: BarChart3,
    grupo: "soporte",
  },
  {
    id: "sistema",
    etiqueta: "Sistema",
    ruta: RUTAS.admin.sistema,
    icono: Settings,
    grupo: "soporte",
  },
]
