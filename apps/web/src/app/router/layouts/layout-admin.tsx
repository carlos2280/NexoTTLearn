import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { AppShell } from "@/shared/ui/patterns/app-shell"
import { NxtToastProvider } from "@carlos2280/nexott-ui/react"
import { Outlet, useLocation } from "react-router-dom"
import { resolveBreadcrumbs } from "./admin-breadcrumbs"
import { ADMIN_NAV_FOOTER, ADMIN_NAV_GROUPS } from "./admin-nav-config"

export function LayoutAdmin() {
  const { data: usuario } = useUsuarioActual()
  const location = useLocation()

  if (!usuario) {
    return null
  }

  const breadcrumbs = resolveBreadcrumbs(location.pathname)

  return (
    <>
      <AppShell
        usuario={usuario}
        groups={ADMIN_NAV_GROUPS}
        footer={ADMIN_NAV_FOOTER}
        breadcrumbs={breadcrumbs}
        appMark="Nx"
        appName="NexoTT"
        appSub="Learn"
      >
        <Outlet />
      </AppShell>

      {/* Toast provider del DS legacy: las paginas admin actuales lo usan.
          Migrar a `sonner` cuando esas paginas se reescriban. */}
      <NxtToastProvider position="top-right" max={4} />
    </>
  )
}
