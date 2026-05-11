import { cn } from "@/shared/lib/cn"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Outlet } from "react-router-dom"
import { useSidebarColapsado } from "../hooks/use-sidebar-colapsado"
import { AdminSidebar } from "./admin-sidebar"
import { AdminTopbar } from "./admin-topbar"

export function AdminShell() {
  const { colapsado, alternar } = useSidebarColapsado()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <aside
          className={cn(
            "hidden shrink-0 overflow-y-auto border-border border-r bg-surface transition-[width] duration-base ease-default md:block",
            colapsado ? "w-16" : "w-[260px]",
          )}
        >
          <AdminSidebar colapsado={colapsado} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-border border-b bg-surface">
            <AdminTopbar sidebarColapsado={colapsado} onAlternarSidebar={alternar} />
          </header>
          <main className="flex-1 overflow-y-auto px-6 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
