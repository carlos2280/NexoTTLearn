import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { ParticipanteTopbar } from "@/pages/participante/bandeja/components/participante-topbar"
import { AmbientMesh } from "@/shared/ui/patterns/ambient-mesh"
import { ParticipanteDock } from "@/shared/ui/patterns/participante-dock"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Outlet } from "react-router-dom"
import { Toaster } from "sonner"

// Layout del participante. Minimalista por decision §3 del doc canonico:
// max-width 860px en main, sin sidebar. El dock fixed bottom entra en
// Fase 2 cuando haya 3 destinos para hospedarlo.
export function LayoutParticipante() {
  const { data: usuario } = useUsuarioActual()

  if (!usuario) {
    return null
  }

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={500}>
      <div className="relative flex min-h-screen flex-col bg-surface-0 text-text-primary">
        <AmbientMesh />

        <div className="relative z-10 flex flex-1 flex-col">
          <ParticipanteTopbar usuario={usuario} />

          <main className="flex flex-1 flex-col px-4 pt-6 pb-32 md:px-6">
            <Outlet />
          </main>
        </div>

        <ParticipanteDock />

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
      </div>
    </TooltipProvider>
  )
}
