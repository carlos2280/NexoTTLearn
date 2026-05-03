import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { AdminSidebar } from "@/shared/components/admin-sidebar"
import { PersonalizationDrawer } from "@/shared/components/personalization-drawer"
import { UserMenu } from "@/shared/components/user-menu"
import { NxtLayout, NxtSidebarToggle, NxtTopbar } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useState } from "react"
import { Outlet } from "react-router-dom"

export function LayoutAdmin() {
  const { data: usuario } = useUsuarioActual()
  const [personalizarAbierto, setPersonalizarAbierto] = useState(false)

  if (!usuario) {
    return null
  }

  return (
    <NxtLayout theme="nexott-learn" sidebarPosition="full">
      <NxtTopbar slot="topbar">
        <NxtSidebarToggle slot="logo" size="sm" />

        <Stack slot="actions" direction="row" align="center" gap="md">
          <UserMenu usuario={usuario} onPersonalizarClick={() => setPersonalizarAbierto(true)} />
        </Stack>
      </NxtTopbar>

      <AdminSidebar />

      <Outlet />

      <PersonalizationDrawer
        open={personalizarAbierto}
        onClose={() => setPersonalizarAbierto(false)}
      />
    </NxtLayout>
  )
}
