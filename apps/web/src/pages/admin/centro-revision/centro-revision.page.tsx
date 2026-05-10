import { useEntregasBloque } from "@/features/admin-centro-revision/hooks/use-entregas-bloque"
import { useEntregasProyecto } from "@/features/admin-centro-revision/hooks/use-entregas-proyecto"
import { PageHeader } from "@/shared/ui/patterns/page-header"
import { type TabItem, Tabs } from "@/shared/ui/patterns/tabs"
import { ClipboardList, FolderOpen } from "lucide-react"
import { ColaEntregas } from "./components/cola-entregas"
import { ColaProyectos } from "./components/cola-proyectos"
import { DrawerEntrega } from "./components/drawer-entrega"
import { DrawerProyecto } from "./components/drawer-proyecto"
import { useItemSeleccionado } from "./hooks/use-item-seleccionado"
import { type TabCentroRevision, useTabActivo } from "./hooks/use-tab-activo"

export function CentroRevisionPage() {
  const { tab, setTab } = useTabActivo()
  const { itemId, seleccionar } = useItemSeleccionado()

  const { data: dataEntregas } = useEntregasBloque({ estado: "PENDIENTE_REVISION" })
  const { data: dataProyectos } = useEntregasProyecto({ estado: "EN_REVISION" })

  const totalEntregas = dataEntregas?.total ?? 0
  const totalProyectos = dataProyectos?.total ?? 0

  const tabItems: readonly TabItem<TabCentroRevision>[] = [
    {
      value: "entregas",
      label: "Entregas",
      icon: ClipboardList,
      badge: totalEntregas > 0 ? totalEntregas : undefined,
    },
    {
      value: "proyectos",
      label: "Proyectos",
      icon: FolderOpen,
      badge: totalProyectos > 0 ? totalProyectos : undefined,
    },
  ]

  function handleSeleccionar(id: string) {
    seleccionar(id)
  }

  function handleCerrarDrawer() {
    seleccionar(null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-6 pb-2">
        <PageHeader
          eyebrow="Admin"
          title="Centro de revisión"
          subtitle="Entregas y proyectos que requieren decisión humana."
        />
      </div>

      <div className="shrink-0 border-glass-border border-b px-6">
        <Tabs items={tabItems} value={tab} onChange={setTab} ariaLabel="Colas de revisión" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "entregas" ? (
          <ColaEntregas itemIdSeleccionado={itemId} onSeleccionar={handleSeleccionar} />
        ) : (
          <ColaProyectos itemIdSeleccionado={itemId} onSeleccionar={handleSeleccionar} />
        )}
      </div>

      {tab === "entregas" ? (
        <DrawerEntrega entregaId={itemId} onCerrar={handleCerrarDrawer} />
      ) : (
        <DrawerProyecto entregaId={itemId} onCerrar={handleCerrarDrawer} />
      )}
    </div>
  )
}
