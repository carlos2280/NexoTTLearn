import { PageHeader } from "@/shared/ui/patterns/page-header"
import { Tabs } from "@/shared/ui/patterns/tabs"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Layers, Users } from "lucide-react"
import { TabAreas } from "./components/tab-areas"
import { TabUsuarios } from "./components/tab-usuarios"
import { type MantenedoresTab, useMantenedoresTab } from "./hooks/use-mantenedores-tab"

const TABS = [
  { value: "usuarios" as const, label: "Usuarios", icon: Users },
  { value: "areas" as const, label: "Áreas", icon: Layers },
] satisfies readonly { value: MantenedoresTab; label: string; icon: typeof Users }[]

export function MantenedoresPage() {
  const { tab, setTab } = useMantenedoresTab()

  return (
    <TooltipProvider delayDuration={200}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="flex flex-col gap-8">
          <PageHeader
            eyebrow="Admin"
            title="Mantenedores"
            subtitle="Catálogos del sistema. Pocas acciones, mucho cuidado: un cambio aquí afecta a todos los flujos."
          />

          <Tabs<MantenedoresTab>
            items={TABS}
            value={tab}
            onChange={setTab}
            ariaLabel="Mantenedores"
          />

          {renderTab(tab)}
        </div>
      </main>
    </TooltipProvider>
  )
}

function renderTab(tab: MantenedoresTab) {
  switch (tab) {
    case "usuarios":
      return <TabUsuarios />
    case "areas":
      return <TabAreas />
    default: {
      const _exhaustive: never = tab
      return _exhaustive
    }
  }
}
