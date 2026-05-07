import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { AppShell } from "@/shared/ui/patterns/app-shell"
import { Outlet, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
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

      <Toaster
        position="top-right"
        visibleToasts={4}
        theme="system"
        toastOptions={{
          classNames: {
            toast:
              "rounded-[var(--radius-lg)] border border-glass-border bg-surface-1/95 text-text-primary shadow-lg backdrop-blur-2xl",
            description: "text-text-secondary",
            success: "text-success",
            error: "text-danger",
          },
        }}
      />
    </>
  )
}
