import { useHubDiagnostico } from "@/features/admin-diagnostico/hooks/use-hub"
import { RUTAS } from "@/shared/constants/rutas"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import type { HubDiagnosticoItem } from "@nexott-learn/shared-types"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { HubContent } from "./components/hub-content"

export function HubDiagnosticoPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useHubDiagnostico()

  const items = data?.items ?? []
  const pendientes = items.filter((item) => item.estadoDiagnostico === "pendiente")

  // hub.md §6 · auto-redirect cuando hay un solo curso pendiente.
  useEffect(() => {
    if (pendientes.length === 1) {
      const unico = pendientes[0]
      if (unico) {
        navigate(RUTAS.admin.cursoCandidatos(unico.cursoId), { replace: true })
      }
    }
  }, [pendientes, navigate])

  const handleIr = (item: HubDiagnosticoItem) => {
    navigate(RUTAS.admin.cursoCandidatos(item.cursoId))
  }
  const handleIrSeguimiento = () => navigate(RUTAS.admin.seguimiento)

  return (
    <TooltipProvider delayDuration={200}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="flex flex-col gap-8">
          <PageHeader
            eyebrow="Admin"
            title="Diagnóstico"
            subtitle="Cursos pendientes de diagnóstico inicial, ordenados por urgencia."
          />
          <HubContent
            items={items}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onIr={handleIr}
            onIrSeguimiento={handleIrSeguimiento}
          />
        </div>
      </main>
    </TooltipProvider>
  )
}
