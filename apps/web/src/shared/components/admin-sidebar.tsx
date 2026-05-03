import { RUTAS } from "@/shared/constants/rutas"
import type { NxtIconoNombre } from "@carlos2280/nexott-ui/react"
import {
  NxtLogo,
  NxtSidebar,
  NxtSidebarGroup,
  NxtSidebarItem,
  NxtSidebarSep,
} from "@carlos2280/nexott-ui/react"
import { useLocation, useNavigate } from "react-router-dom"

type ItemSidebar = {
  label: string
  icon: NxtIconoNombre
  href: string
  badge?: string
}

const ITEMS_PRINCIPALES: ItemSidebar[] = [
  { label: "Bandeja", icon: "dashboard", href: RUTAS.admin.bandeja, badge: "5" },
]

const ITEMS_ADMIN: ItemSidebar[] = [
  { label: "Cursos", icon: "book", href: RUTAS.admin.cursos },
  { label: "Diagnosticos", icon: "compass", href: RUTAS.admin.diagnosticos },
  { label: "Seguimiento", icon: "trending-up", href: RUTAS.admin.seguimiento },
  { label: "Revisiones", icon: "check-circle", href: RUTAS.admin.centroRevision, badge: "5" },
  { label: "Personas", icon: "users", href: RUTAS.admin.personas },
]

const ITEM_FOOTER: ItemSidebar = {
  label: "Configuracion",
  icon: "settings",
  href: RUTAS.admin.configuracion,
}

export function AdminSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const irA = (href: string): void => {
    if (href !== location.pathname) {
      navigate(href)
    }
  }

  const renderItem = (item: ItemSidebar) => (
    <NxtSidebarItem
      key={item.href}
      icon={item.icon}
      label={item.label}
      href={item.href}
      badge={item.badge}
      active={location.pathname === item.href}
      onNxtSidebarItemClick={(event) => {
        event.preventDefault()
        irA(item.href)
      }}
    />
  )

  return (
    <NxtSidebar slot="sidebar" collapsible={true}>
      <NxtLogo slot="header" mark="Lx" text="NexoTT" subtext="Learn" size="md" />
      <NxtSidebarGroup>{ITEMS_PRINCIPALES.map(renderItem)}</NxtSidebarGroup>
      <NxtSidebarSep />
      <NxtSidebarGroup label="Admin">{ITEMS_ADMIN.map(renderItem)}</NxtSidebarGroup>
      <div slot="footer">{renderItem(ITEM_FOOTER)}</div>
    </NxtSidebar>
  )
}
