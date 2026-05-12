import { usePaletaComandos } from "@/features/admin/command-palette/hooks/use-paleta-comandos"
import { PaletaComandos } from "@/features/admin/command-palette/paleta-comandos"
import { cn } from "@/shared/lib/cn"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Outlet } from "react-router-dom"
import { useSidebarColapsado } from "../hooks/use-sidebar-colapsado"
import { AdminSidebar } from "./admin-sidebar"
import { AdminTopbar } from "./admin-topbar"

export function AdminShell() {
  const { colapsado, alternar } = useSidebarColapsado()
  const paleta = usePaletaComandos()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <aside
          className={cn(
            "hidden shrink-0 overflow-y-auto border-border border-r bg-subtle transition-[width] duration-base ease-default md:block",
            colapsado ? "w-16" : "w-[260px]",
          )}
        >
          <AdminSidebar colapsado={colapsado} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-border border-b bg-surface">
            <AdminTopbar
              sidebarColapsado={colapsado}
              onAlternarSidebar={alternar}
              onAbrirPaleta={paleta.abrir}
            />
          </header>
          <main
            className="flex-1 overflow-y-auto px-6 py-8"
            style={{ backgroundImage: "var(--gradient-admin-canvas)" }}
          >
            <Outlet />
          </main>
        </div>
        <PaletaComandos abierta={paleta.abierta} onCerrar={paleta.cerrar} />
      </div>
    </TooltipProvider>
  )
}
