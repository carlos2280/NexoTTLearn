import { cn } from "@/shared/lib/cn"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Outlet } from "react-router-dom"
import { useSidebarColapsadoParticipante } from "../hooks/use-sidebar-colapsado-participante"
import { ParticipanteSidebar } from "./participante-sidebar"
import { ParticipanteTopbar } from "./participante-topbar"

export function ParticipanteShell() {
  const { colapsado, alternar } = useSidebarColapsadoParticipante()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <aside
          className={cn(
            "hidden shrink-0 overflow-y-auto border-border-strong border-r bg-canvas transition-[width] duration-base ease-default md:block",
            colapsado ? "w-16" : "w-[220px]",
          )}
        >
          <ParticipanteSidebar colapsado={colapsado} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-border border-b bg-surface">
            <ParticipanteTopbar sidebarColapsado={colapsado} onAlternarSidebar={alternar} />
          </header>
          <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
            <div className="mx-auto w-full max-w-[1024px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
