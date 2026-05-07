import { RUTAS } from "@/shared/constants/rutas"
import type { SidebarNavGroup, SidebarNavItem } from "@/shared/ui/patterns/app-sidebar"
import {
  BookOpen,
  CheckCircle2,
  Compass,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react"

/* Configuracion del menu admin. Mantenida fuera del layout para que sea
   facil de evolucionar (badges dinamicos, items por permiso, etc.). */

export const ADMIN_NAV_GROUPS: readonly SidebarNavGroup[] = [
  {
    items: [
      {
        label: "Bandeja",
        icon: LayoutDashboard,
        href: RUTAS.admin.bandeja,
      },
    ],
  },
  {
    label: "Gestion",
    items: [
      { label: "Cursos", icon: BookOpen, href: RUTAS.admin.cursos, matchPrefix: true },
      { label: "Diagnostico", icon: Compass, href: RUTAS.admin.diagnosticos, matchPrefix: true },
      { label: "Seguimiento", icon: TrendingUp, href: "#", disabled: true },
      { label: "Revisiones", icon: CheckCircle2, href: "#", disabled: true },
      { label: "Mantenedores", icon: Users, href: "#", disabled: true },
    ],
  },
]

export const ADMIN_NAV_FOOTER: SidebarNavItem = {
  label: "Configuracion",
  icon: Settings,
  href: "#",
  disabled: true,
}
