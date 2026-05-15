import { usePaletaComandos } from "@/features/admin/command-palette/hooks/use-paleta-comandos"
import { PaletaComandos } from "@/features/admin/command-palette/paleta-comandos"
import { CuentaDrawer } from "@/features/auth/components/cuenta-drawer"
import { cn } from "@/shared/lib/cn"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { useState } from "react"
import { Outlet } from "react-router-dom"
import { useSidebarColapsado } from "../hooks/use-sidebar-colapsado"
import { AdminSidebar } from "./admin-sidebar"
import { AdminTopbar } from "./admin-topbar"

export function AdminShell() {
  const { colapsado, alternar } = useSidebarColapsado()
  const paleta = usePaletaComandos()
  const [cuentaAbierta, setCuentaAbierta] = useState(false)

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
          <header className="relative shrink-0 bg-surface">
            <AdminTopbar
              sidebarColapsado={colapsado}
              onAlternarSidebar={alternar}
              onAbrirPaleta={paleta.abrir}
              onAbrirCuenta={() => setCuentaAbierta(true)}
            />
            <div
              aria-hidden={true}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[image:var(--gradient-aurora)] opacity-25"
            />
          </header>
          <main
            className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10"
            style={{ backgroundImage: "var(--gradient-admin-canvas)" }}
          >
            <div className="mx-auto w-full max-w-[1440px]">
              <Outlet />
            </div>
          </main>
        </div>
        <PaletaComandos abierta={paleta.abierta} onCerrar={paleta.cerrar} />
        <CuentaDrawer abierto={cuentaAbierta} onCambiarAbierto={setCuentaAbierta} />
      </div>
    </TooltipProvider>
  )
}
