import { useSidebarState } from "@/shared/hooks/use-sidebar-state"
import type { UsuarioPublico } from "@nexott-learn/shared-types"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { AppSidebar, type SidebarNavGroup, type SidebarNavItem } from "./app-sidebar"
import { AppTopbar, type BreadcrumbCrumb } from "./app-topbar"

interface AppShellProps {
  readonly usuario: UsuarioPublico
  readonly groups: readonly SidebarNavGroup[]
  readonly footer?: SidebarNavItem
  readonly breadcrumbs?: readonly BreadcrumbCrumb[]
  readonly topbarActions?: ReactNode
  readonly onSearchClick?: () => void
  readonly children: ReactNode
  readonly appMark?: string
  readonly appName?: string
  readonly appSub?: string
}

export function AppShell({
  usuario,
  groups,
  footer,
  breadcrumbs,
  topbarActions,
  onSearchClick,
  children,
  appMark,
  appName,
  appSub,
}: AppShellProps) {
  const sidebar = useSidebarState()
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={500}>
      <div className="flex h-dvh w-full overflow-hidden bg-surface-0 text-text-primary">
        <AppSidebar
          groups={groups}
          footer={footer}
          collapsed={sidebar.collapsed}
          onToggle={sidebar.toggle}
          appMark={appMark}
          appName={appName}
          appSub={appSub}
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <AppTopbar
            usuario={usuario}
            breadcrumbs={breadcrumbs}
            actions={topbarActions}
            onSearchClick={onSearchClick}
          />

          <main className="relative flex-1 overflow-y-auto">
            {/* Glow ambiental sutil del fondo (no distrae, da profundidad) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, rgb(124 58 237 / 0.06) 0%, transparent 35%), radial-gradient(circle at 100% 100%, rgb(34 211 238 / 0.04) 0%, transparent 40%)",
              }}
            />

            {/* Page transition: fade + 8up al cambiar de ruta */}
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
